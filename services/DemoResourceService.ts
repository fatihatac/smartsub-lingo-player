export const DemoResourceService = {
  fetchDemoResources: async () => {
    const videoRes = await fetch('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4');
    if (!videoRes.ok) throw new Error("Failed to fetch video");
    
    const videoBlob = await videoRes.blob();
    const demoVideoFile = new File([videoBlob], "demo_joyrides.mp4", { type: "video/mp4" });

    const srtContent = `1\n00:00:00,500 --> 00:00:06,000\nThe rapid advancement of artificial intelligence is reshaping the way we perceive human creativity.\n\n2\n00:00:06,500 --> 00:00:12,000\nWhile some argue that machines can only mimic existing patterns, others believe that the synergy between human intuition and algorithmic precision will lead to an unprecedented era of innovation.\n\n3\n00:00:12,500 --> 00:00:18,000\nUltimately, the challenge lies not in competing with technology, but in learning how to harness its potential to solve the complex problems of the modern world.`;
    
    const subtitleBlob = new Blob([srtContent], { type: 'text/plain' });
    const demoSubtitleFile = new File([subtitleBlob], "demo_ai_text.srt", { type: "text/plain" });

    return { demoVideoFile, demoSubtitleFile };
  }
};
