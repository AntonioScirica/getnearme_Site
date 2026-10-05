import { Config } from '@remotion/cli/config'

// Render come in produzione (Lambda 4.0.421): h264, crf 18, fotogrammi jpeg di alta qualita'
Config.setEntryPoint('src/index.ts')
Config.setVideoImageFormat('jpeg')
Config.setJpegQuality(92)
Config.setCodec('h264')
Config.setCrf(18)
Config.setPixelFormat('yuv420p')
Config.setOverwriteOutput(true)
