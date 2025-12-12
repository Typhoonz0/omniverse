function blockAds() {
    setInterval(function() {
        const bannerHome1 = document.getElementById('banner-home');
        const bannerHome2 = document.getElementById('banner-home2');
        const bannerReswawn1 = document.getElementById('banner-respawn-1');
        const bannerRespawn2 = document.getElementById('banner-respawn-2');
        if (bannerHome1) { bannerHome1.style.display = 'none'; }
        if (bannerHome2) { bannerHome2.style.display = 'none'; } 
        if (bannerReswawn1) { bannerReswawn1.style.display = 'none'; } 
        if (bannerRespawn2) { bannerRespawn2.style.display = 'none'; } 
    }, 500);
}

blockAds()