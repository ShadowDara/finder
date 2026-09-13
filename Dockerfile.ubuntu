# Basis-Image
FROM ubuntu:latest

# Aktualisierung der Paketlisten und Installation von Neovim
RUN apt-get update && \
    apt-get install -y neovim && \
    apt-get install -y curl git

# Benutzer erstellen
RUN useradd -m user

# Arbeitsverzeichnis anlegen
WORKDIR /home/user

# Als ROOT: Home-Verzeichnis dem User zuweisen.
# WICHTIG: muss VOR `USER user` laufen, sonst fehlen die Rechte.
RUN chown -R user:user /home/user

# Kopieren der initiale Konfiguration für Neovim (optional).
# Auch als root kopieren und direkt dem User zuweisen:
# COPY neovim-config/init.vim /home/user/.config/nvim/init.vim
# RUN chown -R user:user /home/user/.config

# Benutzer als Standardbenutzer setzen (erst JETZT wechseln)
USER user

# Default-Befehl (optional - z.B. Neovim starten)
# CMD [ "nvim" ]
