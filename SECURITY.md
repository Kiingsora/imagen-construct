# Security Policy

## Supported versions

Imagen Construct is currently pre-alpha and has no supported executable release. Security support will begin when the first runnable prototype is published.

## Reporting a vulnerability

Do not publish vulnerabilities that expose local files, execute code, leak credentials, or compromise a connected generation backend in a public issue.

Once the repository is public, use GitHub's private security advisory feature when available. If that feature is not enabled, open a minimal public issue requesting a private contact channel without revealing exploit details.

## Security boundaries planned for the MVP

- The editor and generation service bind to localhost by default.
- External network access is not required for normal use after models are installed.
- Project files do not store API keys.
- Model adapters do not execute arbitrary workflow code received from project files.
- Uploaded/imported images are treated as untrusted files.
- Generated assets are decoded and validated before replacing an active layer.
- Paths stored in projects are relative and must not escape the project directory.
- Custom ComfyUI nodes are third-party code and must be treated as separate trust decisions.

## Model safety

Model output can contain unexpected or inappropriate content. Adapters must document model limitations and must not claim that generated output is factual, licensed, or safe by default.
