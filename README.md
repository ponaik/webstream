https://www.mux.com/articles/how-to-convert-mp4-to-hls-format-with-ffmpeg-a-step-by-step-guide

noip ddns kek.bounceme.net set to hamachi local ip

create folder /hls/

create folder with for each hls playlist inside 

/hls/TIR_E01/

    -master.m3u8
    -v0/
        -playlist.m3u8
        -data.tls

create folder /nginx/certs/

add crt.pem

add key.pem

docker compose up -d

paste inside first input

https://kek.bounceme.net/media/hls/TIR_E01/master.m3u8 

select
