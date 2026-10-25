"""
Script to create a clean, lightweight zip package of CarbonCap to share with friends.
Excludes machine-specific venv, node_modules, and cache files.
"""
import os
import zipfile

output_zip = os.path.abspath('../CarbonCap_Clean.zip')
ignore_dirs = {'venv', '.venv', 'node_modules', '.expo', '.git', '__pycache__', '.claude', 'dist'}
ignore_exts = {'.pyc'}

print(f"Packaging CarbonCap to: {output_zip}...")
with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for f in files:
            if any(f.endswith(ext) for ext in ignore_exts):
                continue
            filepath = os.path.join(root, f)
            arcname = os.path.relpath(filepath, '.')
            z.write(filepath, arcname)

size_mb = os.path.getsize(output_zip) / (1024 * 1024)
print(f"[OK] Clean package created! File size: {size_mb:.2f} MB")
print(f"File location: {output_zip}")
