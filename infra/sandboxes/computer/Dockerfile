FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    x11vnc \
    fluxbox \
    xterm \
    xdotool \
    x11-utils \
    x11-xserver-utils \
    imagemagick \
    novnc \
    websockify \
    python3 \
    ca-certificates \
    procps \
    bash \
    chromium \
    wget \
    xz-utils \
    fonts-liberation \
    fonts-dejavu-core \
    dbus-x11 \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /etc/rakazo/fluxbox \
  && printf '%s\n' '#!/bin/sh' 'exec xsetroot -solid "#111113" "$@"' > /usr/bin/fbsetbg \
  && chmod +x /usr/bin/fbsetbg \
  && ln -sfn /bin/true /usr/bin/xmessage
# Real Google Chrome alongside chromium. Sites that gate on the Chrome build
# itself -- enterprise SSO, Widevine, some hospital and banking portals --
# refuse chromium, so the browser launcher prefers Chrome when it is present.
# The .deb configures its own apt source, so the image stays upgradable.
RUN wget -qO /tmp/google-chrome.deb \
      https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
  && apt-get update \
  && apt-get install -y --no-install-recommends /tmp/google-chrome.deb \
  && rm -f /tmp/google-chrome.deb \
  && rm -rf /var/lib/apt/lists/*
# Node.js. The image shipped without a runtime, so anything a bot wanted to run
# -- a scraper, a build, a browser-automation script -- meant apt-installing
# Node first, and Debian's `nodejs` is 18, which current Playwright refuses.
# Installing the official LTS tarball keeps `node`, `npm`, and `npx` on PATH and
# survives container recreation.
ARG NODE_VERSION=v22.14.0
RUN wget -qO /tmp/node.tar.xz \
      "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz" \
  && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
       --exclude=CHANGELOG.md --exclude=LICENSE --exclude=README.md \
  && rm -f /tmp/node.tar.xz \
  && node --version && npm --version
ENV DISPLAY=:1
ENV HOME=/home/rakazo
WORKDIR /home/rakazo
COPY start.sh /usr/local/bin/rakazo-computer
COPY rakazo-browser /usr/local/bin/rakazo-browser
COPY fluxbox.init /etc/rakazo/fluxbox/init
COPY fluxbox.apps /etc/rakazo/fluxbox/apps
COPY fluxbox.menu /etc/rakazo/fluxbox/menu
COPY embed.html /usr/share/novnc/embed.html
RUN chmod +x /usr/local/bin/rakazo-computer /usr/local/bin/rakazo-browser
EXPOSE 6080 6081 6082 6083 6084 6085 6086 6087 6088 6089 6090 6091 6092 6093 6094 6095
CMD ["/usr/local/bin/rakazo-computer"]
