import os
import sys
import json
import shutil
import hashlib
import tarfile
import subprocess
from pathlib import Path

def main():
    if len(sys.argv) < 2:
        print("Usage: python package_tool.py <executa-folder-name>")
        print("Example: python package_tool.py doc-brutalist")
        sys.exit(1)

    folder_name = sys.argv[1]
    executa_dir = Path("executas") / folder_name

    if not executa_dir.exists():
        print(f"Error: Directory {executa_dir} does not exist.")
        sys.exit(1)

    executa_json_path = executa_dir / "executa.json"
    if not executa_json_path.exists():
        print(f"Error: {executa_json_path} not found.")
        sys.exit(1)

    with open(executa_json_path, "r", encoding="utf-8") as f:
        config = json.load(f)

    # Resolve metadata
    tool_id = config.get("tool_id") or config.get("slug")
    if not tool_id:
        # Fallback to manifest tool_id or slug if bundled:doc-brutalist format
        tool_id = "doc-brutalist"
    
    # Clean tool_id for file names if it has colons (like bundled:doc-brutalist)
    clean_tool_id = tool_id.replace(":", "-")
    version = config.get("version") or "1.0.0"
    display_name = config.get("name") or "Tool"
    description = config.get("description") or ""

    # Find the python plugin script
    plugin_name = folder_name.replace("-", "_") + "_plugin.py"
    entry_file = executa_dir / plugin_name
    if not entry_file.exists():
        # fallback search
        py_files = list(executa_dir.glob("*.py"))
        if len(py_files) == 1:
            entry_file = py_files[0]
        else:
            print(f"Error: Entry file {entry_file} not found.")
            sys.exit(1)

    print(f"Packaging executa: {folder_name}")
    print(f"Tool ID:           {tool_id} (Cleaned: {clean_tool_id})")
    print(f"Version:           {version}")
    print(f"Entry File:        {entry_file}")

    # Set up paths
    dist_dir = Path("dist")
    build_dir = Path("build")
    staging_dir = Path("dist-anna") / f"staging-windows-x86_64"
    bin_dir = staging_dir / "bin"

    # Clean previous builds
    for path in [dist_dir, build_dir, staging_dir]:
        if path.exists():
            shutil.rmtree(path)

    staging_dir.mkdir(parents=True, exist_ok=True)
    bin_dir.mkdir(parents=True, exist_ok=True)

    print("\n==> Compiling single-file executable using PyInstaller...")
    
    # Run PyInstaller via uv
    cmd = [
        "uv", "run", "--with", "pyinstaller",
        "python", "-m", "PyInstaller",
        "--onefile",
        "--clean",
        "--noupx",
        "--name", clean_tool_id,
        str(entry_file)
    ]
    
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True if sys.version_info >= (3, 7) else False)
    
    if result.returncode != 0:
        print("Error: PyInstaller build failed.")
        sys.exit(1)

    # Windows PyInstaller generates .exe
    binary_name = f"{clean_tool_id}.exe"
    compiled_binary = dist_dir / binary_name
    
    if not compiled_binary.exists():
        # Check if compiled without extension (e.g. on Unix if run locally)
        compiled_binary = dist_dir / clean_tool_id
        binary_name = clean_tool_id
        if not compiled_binary.exists():
            print(f"Error: Compiled binary not found in {dist_dir}")
            sys.exit(1)

    # Copy to staging bin
    dest_binary = bin_dir / binary_name
    shutil.copy(compiled_binary, dest_binary)
    print(f"Copied binary to {dest_binary}")

    # Write manifest.json
    manifest_path = staging_dir / "manifest.json"
    entrypoint = f"bin/{binary_name}"
    manifest = {
        "name": clean_tool_id,
        "display_name": display_name,
        "version": version,
        "description": description,
        "runtime": {
            "binary": {
                "entrypoint": {
                    "default": entrypoint
                },
                "permissions": {
                    entrypoint: "0o755"
                }
            }
        }
    }

    with open(manifest_path, "w", encoding="utf-8") as mf:
        json.dump(manifest, mf, indent=2)
    print(f"Generated manifest.json at {manifest_path}")

    # Create .tar.gz archive
    archive_name = f"{clean_tool_id}-windows-x86_64.tar.gz"
    archive_path = Path("dist-anna") / archive_name
    
    print(f"Creating archive: {archive_path}...")
    with tarfile.open(archive_path, "w:gz") as tar:
        # Add staging directory files as root files in tar
        for file_path in staging_dir.iterdir():
            tar.add(file_path, arcname=file_path.name)

    # Compute SHA-256
    sha256 = hashlib.sha256()
    with open(archive_path, "rb") as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    sha256_hex = sha256.hexdigest()

    # Get size
    size_bytes = archive_path.stat().st_size

    print("\n==========================================")
    print("SUCCESSFULLY PACKAGED ARTIFACT")
    print("==========================================")
    print(f"Archive Path: {archive_path.resolve()}")
    print(f"SHA-256:      {sha256_hex}")
    print(f"Size:          {size_bytes} bytes")
    print(f"Entrypoint:    {entrypoint}")
    print("\nPaste the following JSON in the Developer Console for windows-x86_64:")
    print(json.dumps({
        "windows-x86_64": {
            "url": f"https://github.com/parth-bansal081/Mirror-AI/releases/download/v{version}/{archive_name}",
            "sha256": sha256_hex,
            "size": size_bytes,
            "entrypoint": entrypoint,
            "format": "tar.gz"
        }
    }, indent=2))

if __name__ == "__main__":
    main()
