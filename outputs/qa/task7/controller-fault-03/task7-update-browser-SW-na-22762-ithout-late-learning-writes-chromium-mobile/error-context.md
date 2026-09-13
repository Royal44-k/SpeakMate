# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task7-update-browser.spec.ts >> SW: native category controller-change rejects without late learning writes
- Location: tests\e2e\task7-update-browser.spec.ts:159:3

# Error details

```
Error: page.evaluate: TypeError: Cannot read properties of null (reading 'postMessage')
    at changed (eval at evaluate (:311:30), <anonymous>:18:19)
    at new Promise (<anonymous>)
    at eval (eval at evaluate (:311:30), <anonymous>:8:31)
    at async <anonymous>:337:30
```