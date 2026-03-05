import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0';

// 強制從遠端抓模型
env.allowLocalModels = false;

let transcriber = null;

self.onmessage = async (e) => {
    const audioData = e.data.audio;

    try {
        if (!transcriber) {
            self.postMessage({ status: 'log', msg: '⚙️ 正在加載模型 (Whisper-Base, 150MB)...' });
            transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
                progress_callback: (p) => {
                    if (p.status === 'progress') {
                        self.postMessage({ status: 'model-progress', progress: p.progress });
                    }
                }
            });
            self.postMessage({ status: 'log', msg: '⚙️ 模型加載完畢！' });
        }

        self.postMessage({ status: 'working' });
        self.postMessage({ status: 'log', msg: '🔥 AI 開始運算（這不是卡住，是 CPU 在全力衝刺）...' });

        // 真正開始跑 AI 推理
        const output = await transcriber(audioData, {
            chunk_length_s: 30,
            stride_length_s: 5,
            language: 'chinese',
            task: 'transcribe',
            return_timestamps: true,
            repetition_penalty: 1.2 // 減少幻聽亂碼
        });

        self.postMessage({ status: 'done', chunks: output.chunks });

    } catch (err) {
        self.postMessage({ status: 'error', msg: err.message });
    }
};
