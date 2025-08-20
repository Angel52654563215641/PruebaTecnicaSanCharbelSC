window.onload = () => {
    const video = document.getElementById("bg-video");
    const source = document.getElementById("bg-source");
  
    const videos = [
      "{{ url_for('static', filename='media/animal1.mp4') }}",
      "{{ url_for('static', filename='media/animal2.mp4') }}",
      "{{ url_for('static', filename='media/animal3.mp4') }}",
      "{{ url_for('static', filename='media/animal4.mp4') }}",
      "{{ url_for('static', filename='media/animal5.mp4') }}",
      "{{ url_for('static', filename='media/animal6.mp4') }}"
    ];
  
    let index = 0;
  
    video.onended = () => {
      index = (index + 1) % videos.length;
      source.src = videos[index];
      video.load();
      video.play();
    };
  };
  