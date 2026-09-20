# JV-web-tools extension

Version 1.0.1 focuses on producing a portable current-site browser-state export.

## Compatibility changes in 1.0.1

- Requests both HTTP and HTTPS permission for the active hostname before reading cookies.
- Reads and merges domain cookies plus cookies matching both HTTP and HTTPS forms of the current page.
- Preserves session cookies without inventing an expiration value.
- Leaves `origins` empty by default.
- Makes localStorage export optional and off by default.
- Uses the cookie store associated with the active tab when available.
- Does not upload exported data.

These changes are intended to avoid dropping non-Secure cookies when the user is currently on an HTTPS page and to avoid restoring volatile localStorage state unless the user explicitly requests it.

## Manual test

1. Open a normal HTTP or HTTPS website.
2. Click the extension.
3. Leave **Include localStorage** off for the most portable export.
4. Click **Export Web JSON**.
5. Approve site permission when prompted.
6. Confirm the summary reports both Secure and regular cookies when the site has both.
7. Download the JSON.
