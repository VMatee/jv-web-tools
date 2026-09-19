# Security

JV-web-tools exports browser state that may include sensitive authentication or session information.

## Please do not report secrets publicly

Do not include any of the following in a public GitHub issue:

- exported JSON files;
- cookies or session tokens;
- authentication credentials;
- private localStorage contents;
- private browsing data.

For ordinary bugs that do not contain sensitive data, open a GitHub issue and provide only redacted diagnostics.

## Safe handling

Treat exported website-data JSON files like credentials. Keep them out of source control, public issue trackers, chat logs, screenshots, and shared folders unless all sensitive values have been removed.
