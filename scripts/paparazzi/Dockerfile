# The Linux amd64 image Compose's Paparazzi goldens are recorded and verified
# in, like CI's ubuntu-latest Android job (Zulu 17). Build it once with
# `pnpm android:paparazzi build` (scripts/paparazzi/run.sh), which builds this
# file for linux/amd64 as kozmos-paparazzi:17.
FROM --platform=linux/amd64 azul/zulu-openjdk:17
RUN apt-get update && apt-get install -y --no-install-recommends unzip curl ca-certificates fontconfig \
    && rm -rf /var/lib/apt/lists/*
ENV ANDROID_HOME=/opt/android-sdk ANDROID_SDK_ROOT=/opt/android-sdk
RUN mkdir -p $ANDROID_HOME/cmdline-tools \
    && curl -fsSL https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o /tmp/clt.zip \
    && unzip -q /tmp/clt.zip -d $ANDROID_HOME/cmdline-tools \
    && mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest && rm /tmp/clt.zip
# The SDK licences the caller has already accepted on their own machine, which
# run.sh copies into the build context: copied, never accepted here.
COPY licenses/ $ANDROID_HOME/licenses/
# Platform-Tools too: without them the Android Gradle plugin installs them in
# every run's throwaway container, a download each time.
RUN $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --install "platform-tools" "platforms;android-34" "build-tools;34.0.0"
WORKDIR /repo/packages/android
