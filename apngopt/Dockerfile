FROM emscripten/emsdk as builder

COPY apngopt.patch Makefile.patch /src/

RUN wget -O apngopt.zip https://master.dl.sourceforge.net/project/apng/APNG_Optimizer/1.4/apngopt-1.4-src.zip && \
    mkdir -p /src && \
    unzip apngopt.zip -d /src && \
    rm apngopt.zip && \
    cd /src/ && \
    patch < apngopt.patch && \
    patch < Makefile.patch && \
    make

FROM scratch

COPY --from=builder /src/apngopt.js /src/apngopt.wasm ./
