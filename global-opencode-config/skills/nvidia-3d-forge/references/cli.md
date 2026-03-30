# CLI Examples

## Reference-guided hosted run (recommended)

```bash
python3 "$HOME/.config/opencode/skills/nvidia-3d-forge/scripts/forge_3d_asset.py" \
  --prompt "mascot character from provided image, preserve silhouette and details" \
  --reference-image /absolute/path/mascot.png \
  --quality-preset cinema \
  --best-of 6 \
  --max-rounds 2
```

## Text-only run

```bash
python3 "$HOME/.config/opencode/skills/nvidia-3d-forge/scripts/forge_3d_asset.py" \
  --prompt "toy-like metallic spherical mascot, dark visor face, cyan eyes" \
  --quality-preset balanced
```

## Hosted preview image token run

```bash
python3 "$HOME/.config/opencode/skills/nvidia-3d-forge/scripts/forge_3d_asset.py" \
  --input-mode image \
  --image-example-id 0 \
  --prompt "same object style as example" \
  --quality-preset fast
```

## Dry run

```bash
python3 "$HOME/.config/opencode/skills/nvidia-3d-forge/scripts/forge_3d_asset.py" \
  --prompt "mascot" \
  --reference-image /absolute/path/mascot.png \
  --dry-run --verbose
```
