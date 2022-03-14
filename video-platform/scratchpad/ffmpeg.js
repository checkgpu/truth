//<script src="//cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.10.1/dist/ffmpeg.min.js" crossorigin="anonymous"></script>

const { createFFmpeg, fetchFile } = FFmpeg;

var ffmpeg = null;

async function transcode() {
  await do_transcode(UPLOAD_FILE)
}

const do_transcode = async (file) => {
  ffmpeg = createFFmpeg({
    //mainName: 'main',
    //corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
    log: true,
    progress: ({ ratio }) => {
      console.log(ratio)
      setGlobalState({upload: {ratio: ratio}})
      //message.innerHTML = `Complete: ${(ratio * 100.0).toFixed(2)}%`;
    },
  });
  await ffmpeg.load();

  const { name } = file;
  ffmpeg.FS('writeFile', name, await fetchFile(file));
  
  //Get video info (res, fps, audio track)  
  var info_video;
  var info_audio;
  ffmpeg.setLogger(({ type, message }) => {
    if (type == "fferr" && message.includes(": Video: ")) {
      info_video = message
    }
    if (type == "fferr" && message.includes(": Audio: ")) {
      info_audio = message
    }
  })
  await ffmpeg.run('-v', 'info', '-i', name)

  console.log(info_video)
  console.log(info_audio)
  var [width,height] = info_video.match(/\ \d+x\d+\ /g)[0].trim().split("x");
  width = Number(width)
  height = Number(height)
  var fps = Number(info_video.match(/\d+\ fps/g)[0].replace(" fps", ""))

  //Prepare ffmpeg command
  var bitrate_table = [
    {width: 1920, height: 1080, rate: 6_600_000, tag: "1080p"},
    {width: 1280, height: 720, rate: 3_300_000, tag: "720p"},
    {width: 640, height: 480, rate: 1_100_000, tag: "480p"},
    {width: 480, height: 360, rate: 600_000, tag: "360p"},
    {width: 256, height: 144, rate: 200_000, tag: "144p"},
  ]
  bitrate_table = bitrate_table.filter(e=> e.width <= width && e.height <= height)
  bitrate_table = bitrate_table.map(e=> {
    if (fps <= 30) {
      return e
    } else {
      e.rate = e.rate * 1.5
      return e
    }
  });

  //Build args
  var args = []
  args = args.concat(['-i', name])
  if (fps > 60) {
    args = args.concat(['-r', '60'])
  }
  args = args.concat(['-force_key_frames', 'expr:gte(t,n_forced*2)', '-sc_threshold', '0'])

  //Video track (no Audio)
  if (!info_audio) {
    args = bitrate_table.reduce((acc,v)=> acc.concat(['-map', '0:v:0']), args)
    args = args.concat(['-c:v', 'libx264', '-crf', '22'])

    args = bitrate_table.reduce((acc,v,idx)=> acc.concat(
      [`-filter:v:${idx}`, `scale=w=${v.width}:h=${v.height}`, `-maxrate:v:${idx}`, `${v.rate}`]), args)

    var var_stream_map = bitrate_table.reduce((acc,v,idx)=> acc += `v:${idx},name:${v.tag} `, "")
    var_stream_map = var_stream_map.trim()
    args = args.concat(['-var_stream_map', var_stream_map])
  //Video + Audio Track
  } else {
    args = bitrate_table.reduce((acc,v)=> acc.concat(['-map', '0:v:0', '-map', '0:a:0']), args)
    args = args.concat(['-c:v', 'libx264', '-crf', '22', '-c:a', 'aac', '-ar', '48000'])

    args = bitrate_table.reduce((acc,v,idx)=> acc.concat(
      [`-filter:v:${idx}`, `scale=w=${v.width}:h=${v.height}`, `-maxrate:v:${idx}`, `${v.rate}`, `-b:a:${idx}`, '128k']), args)

    var var_stream_map = bitrate_table.reduce((acc,v,idx)=> acc += `v:${idx},a:${idx},name:${v.tag} `, "")
    var_stream_map = var_stream_map.trim()
    args = args.concat(['-var_stream_map', var_stream_map])
  }

  args = args.concat(['-preset', 'slow'])
  args = args.concat(['-hls_list_size', '0', '-f', 'hls', '-hls_playlist_type', 'event', '-hls_time', '6', '-hls_flags', 'single_file'])
  args = args.concat(['-hls_segment_type', 'fmp4', '-movflags', '+faststart', '-master_pl_name', 'pl.m3u8'])
  args = args.concat(['%v.m3u8'])

  //Transcode
  await ffmpeg.run(...args);

  var data;
  //data = ffmpeg.FS('readFile', '.');
  //console.log(data)
  data = ffmpeg.FS('readFile', 'pl.m3u8');
  console.log(data)
  //const video = document.getElementById('output-video');
  //video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
}