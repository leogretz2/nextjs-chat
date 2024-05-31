{pkgs}: {
  deps = [
    pkgs.nodejs-16_x # Adjust the Node.js version as needed
    # pkgs.pnpm
    pkgs.npm
  ];

  hooks = {
    postInstall = ''
      echo "npm and Node.js are installed."
    '';
  };
}
