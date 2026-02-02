export default function VideoSection() {
  return (
    <section className="w-full bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
            See Floventory in Action
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-neutral-700">
            Watch how easy it is to manage your inventory with Floventory
          </p>
        </div>

        <div className="mt-12">
          <div className="relative mx-auto aspect-video max-w-5xl overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-lg">
            {/* YouTube embed container */}
            <iframe
              className="h-full w-full"
              src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
              title="Floventory Demo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="mt-4 text-center text-sm text-neutral-600">
            Replace YOUR_VIDEO_ID with your actual YouTube video ID
          </p>
        </div>
      </div>
    </section>
  );
}
