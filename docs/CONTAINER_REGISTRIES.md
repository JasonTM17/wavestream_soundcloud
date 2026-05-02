# WaveStream Container Registries

WaveStream publishes or mirrors the web and API images in two registries. The names are intentionally different because each registry uses a different account namespace.

## Docker Hub

Use Docker Hub when you want the public images under the Docker Hub account shown in Docker Desktop.

```bash
docker pull nguyenson1710/wavestream-web:main
docker pull nguyenson1710/wavestream-api:main
```

Available public repositories:

- `nguyenson1710/wavestream-web`
- `nguyenson1710/wavestream-api`

`docker-compose.prod.yml` uses Docker Hub by default:

```yaml
image: nguyenson1710/wavestream-web:${WAVESTREAM_IMAGE_TAG:-main}
image: nguyenson1710/wavestream-api:${WAVESTREAM_IMAGE_TAG:-main}
```

## GitHub Packages / GHCR

GHCR packages are attached to the GitHub repository owner. Because this repository is under `JasonTM17/Wavestream_Soundcloud`, the GHCR image names use `jasontm17`.

```bash
docker pull ghcr.io/jasontm17/wavestream-web:main
docker pull ghcr.io/jasontm17/wavestream-api:main
```

Available repository-attached packages:

- `ghcr.io/jasontm17/wavestream-web`
- `ghcr.io/jasontm17/wavestream-api`

## CI/CD Behavior

- GHCR publishing uses the built-in `GITHUB_TOKEN` and runs from GitHub Actions.
- Docker Hub publishing requires repository secrets:
  - `DOCKERHUB_USERNAME`
  - `DOCKERHUB_TOKEN`
- If Docker Hub secrets are missing, the Docker Hub publish job is skipped instead of failing CI/CD.

## Which One Should I Use?

- Use `nguyenson1710/wavestream-*` when checking Docker Hub or deploying with the provided production compose file.
- Use `ghcr.io/jasontm17/wavestream-*` when checking GitHub Packages for this repository.
- Both names can point to the same WaveStream web/API images, but they live in different registries.
