import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the entire portalApi module so tests can script the network.
vi.mock('@/lib/portalApi', async () => {
  const actual = await vi.importActual<typeof import('@/lib/portalApi')>('@/lib/portalApi');
  return {
    ...actual,
    lookupPortalBooking: vi.fn(),
    fetchPortalInvoices: vi.fn(),
    payPortalDeposit: vi.fn(),
  };
});

// Mock the shared axios so tests don't need VITE_API_URL.
vi.mock('@/lib/api', () => ({ default: { defaults: { baseURL: 'http://localhost:8000/api' } } }));

import * as portalApi from '@/lib/portalApi';
import PortalBillingPage from '@/features/portal/BillingPage';

const mocked = portalApi as unknown as {
  lookupPortalBooking: ReturnType<typeof vi.fn>;
  fetchPortalInvoices: ReturnType<typeof vi.fn>;
  payPortalDeposit: ReturnType<typeof vi.fn>;
};

const booking = {
  id: 17,
  booking_reference: 'BK-TEST01',
  check_in_date: '2026-07-01',
  check_out_date: '2026-07-05',
  status: 'confirmed',
  total_price: 99000,
  guest: { first_name: 'Jane', last_name: 'Doe' },
};

const baseInvoices = (lines: portalApi.PortalInvoiceLine[]) => ({
  booking: {
    id: booking.id,
    booking_reference: booking.booking_reference,
    check_in_date: booking.check_in_date,
    check_out_date: booking.check_out_date,
    status: booking.status,
    total_price: booking.total_price,
  },
  lines,
  pdf_token: 'pdf-token',
  pdf_expires_in: 900,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PortalBillingPage', () => {
  it('renders the identify gate on first visit', () => {
    mocked.lookupPortalBooking.mockResolvedValue({ data: { success: true, data: { booking, access_token: 'tok', expires_in: 600 } } });
    render(<PortalBillingPage />);
    expect(screen.getByText('Billing & Payments')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('BK-XXXXXX')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view my billing/i })).toBeInTheDocument();
  });

  it('shows an error when neither field is provided', async () => {
    mocked.lookupPortalBooking.mockResolvedValue({ data: { success: true, data: { booking, access_token: 'tok', expires_in: 600 } } });
    render(<PortalBillingPage />);
    fireEvent.click(screen.getByRole('button', { name: /view my billing/i }));
    // The error pill says "...last name." (period, end of sentence).
    // The intro copy ends with "...receipts." — disambiguate.
    expect(await screen.findByText(/last name\.$/i)).toBeInTheDocument();
  });

  it('shows 404 message when the API returns not found', async () => {
    mocked.lookupPortalBooking.mockRejectedValue({ response: { status: 404, data: { message: 'No booking found' } } });
    render(<PortalBillingPage />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('BK-XXXXXX'), 'BK-MISSING');
    await user.type(screen.getByPlaceholderText(/as on the booking/i), 'Ghost');
    await user.click(screen.getByRole('button', { name: /view my billing/i }));
    expect(await screen.findByText(/no booking found/i)).toBeInTheDocument();
  });

  it('hides the Pay button when there is no outstanding balance', async () => {
    mocked.lookupPortalBooking.mockResolvedValue({
      data: { success: true, data: { booking, access_token: 'list-tok', expires_in: 600 } },
    });
    mocked.fetchPortalInvoices.mockResolvedValue({
      data: {
        success: true,
        data: baseInvoices([
          { id: 'PAY-1', date: '2026-07-01', description: 'Cash payment', amount: 99000, status: 'paid', purpose: null },
        ]),
      },
    });

    render(<PortalBillingPage />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('BK-XXXXXX'), booking.booking_reference);
    await user.type(screen.getByPlaceholderText(/as on the booking/i), 'Doe');
    await user.click(screen.getByRole('button', { name: /view my billing/i }));

    // Wait for the invoice list to render.
    await waitFor(() => {
      expect(screen.getByText(/Outstanding/i)).toBeInTheDocument();
    });

    // No Pay button should exist anywhere on the page.
    expect(screen.queryByRole('button', { name: /^Pay$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pay with M-Pesa/i })).not.toBeInTheDocument();
    // And the Outstanding tile should show KES 0.
    expect(screen.getByText('KES 0')).toBeInTheDocument();
  });

  it('shows the Pay button when an outstanding balance line is returned', async () => {
    mocked.lookupPortalBooking.mockResolvedValue({
      data: { success: true, data: { booking, access_token: 'list-tok', expires_in: 600 } },
    });
    mocked.fetchPortalInvoices.mockResolvedValue({
      data: {
        success: true,
        data: baseInvoices([
          { id: 'PAY-1', date: '2026-06-04', description: 'Cash payment', amount: 49500, status: 'paid', purpose: null },
          { id: 'BAL-17', date: '2026-07-05', description: 'Balance due on arrival', amount: 44500, status: 'pending' },
        ]),
      },
    });

    render(<PortalBillingPage />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('BK-XXXXXX'), booking.booking_reference);
    await user.type(screen.getByPlaceholderText(/as on the booking/i), 'Doe');
    await user.click(screen.getByRole('button', { name: /view my billing/i }));

    // Outstanding banner with Pay button appears.
    const payBtn = await screen.findByRole('button', { name: /Pay with M-Pesa/i });
    expect(payBtn).toBeInTheDocument();

    // The Outstanding stat tile shows 44,500 (may appear in the banner
    // and the stat tile — both should display it).
    expect(screen.getAllByText('KES 44,500').length).toBeGreaterThan(0);
  });

  it('opens the pay modal, calls payPortalDeposit on confirm, and shows success', async () => {
    mocked.lookupPortalBooking.mockResolvedValue({
      data: { success: true, data: { booking, access_token: 'list-tok', expires_in: 600 } },
    });
    mocked.fetchPortalInvoices.mockResolvedValue({
      data: {
        success: true,
        data: baseInvoices([
          { id: 'BAL-17', date: '2026-07-05', description: 'Balance due on arrival', amount: 44500, status: 'pending' },
        ]),
      },
    });
    mocked.payPortalDeposit.mockResolvedValue({
      data: {
        success: true,
        data: {
          stk: {
            MerchantRequestID: 'm-1',
            CheckoutRequestID: 'co-1',
            ResponseCode: '0',
            ResponseDescription: 'ok',
            CustomerMessage: 'Enter your PIN to complete',
          },
          purpose: 'deposit',
        },
      },
    });

    render(<PortalBillingPage />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('BK-XXXXXX'), booking.booking_reference);
    await user.type(screen.getByPlaceholderText(/as on the booking/i), 'Doe');
    await user.click(screen.getByRole('button', { name: /view my billing/i }));

    // Open the pay modal. The list row has a small "Pay" button;
    // the banner has the longer "Pay with M-Pesa" — use the row button
    // so the click target is unambiguous.
    const rowPayBtn = await screen.findByRole('button', { name: /^Pay$/ });
    await user.click(rowPayBtn);

    // The Deposit tab is inside the pay modal which only mounts when
    // payingLine is set. The tab's accessible name includes the amount
    // (e.g. "Deposit KES 13,400"), so match by prefix.
    expect(
      await screen.findByRole('tab', { name: /^Deposit\b/ }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Pay full\b/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Custom\b/ })).toBeInTheDocument();

    // Default tab is Deposit → button text contains suggested deposit.
    // Suggested deposit for 44,500 is ceil(44500*0.3/100)*100 = 13400, min 1000.
    expect(screen.getByRole('button', { name: /Pay deposit · KES/i })).toBeInTheDocument();

    // Fill phone and confirm.
    const phone = screen.getByPlaceholderText('+2547XX XXX XXX');
    fireEvent.change(phone, { target: { value: '+254712345678' } });
    await user.click(screen.getByRole('button', { name: /Pay deposit · KES/i }));

    await waitFor(() => {
      expect(mocked.payPortalDeposit).toHaveBeenCalledTimes(1);
    });
    const call = mocked.payPortalDeposit.mock.calls[0][0];
    expect(call.phone).toBe('+254712345678');
    expect(call.amount).toBeGreaterThan(0);
    expect(call.purpose).toBe('deposit');

    // Success state shows the prompt message.
    expect(await screen.findByText(/Enter your PIN to complete/i)).toBeInTheDocument();
  });

  it('stores the session in sessionStorage after a successful lookup', async () => {
    mocked.lookupPortalBooking.mockResolvedValue({
      data: { success: true, data: { booking, access_token: 'list-tok-2', expires_in: 600 } },
    });
    mocked.fetchPortalInvoices.mockResolvedValue({
      data: { success: true, data: baseInvoices([]) },
    });

    render(<PortalBillingPage />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText('BK-XXXXXX'), booking.booking_reference);
    await user.type(screen.getByPlaceholderText(/as on the booking/i), 'Doe');
    await user.click(screen.getByRole('button', { name: /view my billing/i }));

    await waitFor(() => {
      const raw = sessionStorage.getItem('staysync_portal_billing_session');
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw as string);
      expect(parsed.bookingId).toBe(booking.id);
      expect(parsed.listToken).toBe('list-tok-2');
    });
  });

  it('clears the session and returns to the gate on sign out', async () => {
    sessionStorage.setItem('staysync_portal_billing_session', JSON.stringify({
      bookingId: booking.id,
      reference: booking.booking_reference,
      lastName: 'Doe',
      listToken: 'list-tok-old',
    }));
    mocked.fetchPortalInvoices.mockResolvedValue({
      data: { success: true, data: baseInvoices([]) },
    });

    render(<PortalBillingPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Sign out of billing/i }));
    expect(sessionStorage.getItem('staysync_portal_billing_session')).toBeNull();
    expect(screen.getByPlaceholderText('BK-XXXXXX')).toBeInTheDocument();
  });

  it('shows an error message if the invoices request fails with 401', async () => {
    sessionStorage.setItem('staysync_portal_billing_session', JSON.stringify({
      bookingId: booking.id,
      reference: booking.booking_reference,
      lastName: 'Doe',
      listToken: 'expired',
    }));
    mocked.fetchPortalInvoices.mockRejectedValue({ response: { status: 401, data: { message: 'expired' } } });

    render(<PortalBillingPage />);
    expect(await screen.findByText(/your session expired/i)).toBeInTheDocument();
    expect(sessionStorage.getItem('staysync_portal_billing_session')).toBeNull();
  });
});
