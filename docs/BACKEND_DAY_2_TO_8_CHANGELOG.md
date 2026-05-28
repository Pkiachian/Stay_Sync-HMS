# Backend Day 2 To Day 8 Changelog

This document records the backend work completed from the project plan for the Backend Lead role.

## Day 2

- Added room type CRUD with room counts.
- Added room CRUD with status/type/floor filters.
- Added room status changes through `RoomStatusService`.
- Added dashboard statistics endpoint.

## Day 3

- Added searchable guest CRUD.
- Added booking create/list/detail endpoints.
- Added `BookingService` with transaction-based availability checks.
- Added `PricingEngine` with nightly totals, tax, overrides, weekend surcharge, and occupancy yield logic.
- Added `BookingConflictException`.
- Added room availability endpoint.

## Day 4

- Added check-in, check-out, cancel, and no-show booking lifecycle endpoints.
- Added booking update with availability re-check and price recalculation.
- Added tape chart endpoint.
- Added booking and room status broadcast event classes.

## Day 5

- Added housekeeping task list/create/update/complete endpoints.
- Added scheduler entries for checkout cleaning tasks and no-show marking.
- Completing housekeeping tasks now marks rooms available.

## Day 6

- Added folio summary, charge posting, charge voiding, payment listing, and payment recording.
- Added auto-posting of nightly room charges at check-in.
- Added invoice Blade view with dompdf fallback behavior.

## Day 7

- Added rate lookup and override management endpoints.
- Added booking confirmation, pre-arrival, and post-departure mail classes and views.
- Added scheduled commands for pre-arrival and post-departure emails.
- Added settings get/update endpoints.

## Day 8

- Added occupancy, revenue, room type performance, and guest statistics report endpoints.
- Added `CheckRole` middleware and role-protected route groups.
- Added activity log model/service and logging for critical actions.
- Added JSON exception handler for consistent API errors.

## Verification Limit

PHP, Composer, MySQL, and a full Laravel scaffold are not present in this workspace, so framework commands and tests could not be executed here. The code has been organized for Laravel conventions, but it still needs a full Laravel app scaffold before runtime verification.
