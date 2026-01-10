(() => {
  /* -----------------------------
   * 1) Auto Carousel (px-based)
   * ----------------------------- */
  const carousels = document.querySelectorAll(".carousel");

  // 將 resize / visibility 的 handler 做成共用（避免每個 carousel 都綁一次）
  const resizeHandlers = [];
  const visibilityHandlers = [];

  if (carousels.length) {
    carousels.forEach((carousel) => {
      const track = carousel.querySelector(".carousel__track");
      if (!track) return;

      const slides = Array.from(track.children).filter(
        (el) => el.nodeType === 1 && el.classList.contains("carousel__slide")
      );
      if (slides.length <= 1) return;

      const interval = Number(carousel.dataset.interval || 3000);

      // 由 JS 接管：避免 CSS keyframes 還在跑
      track.style.animation = "none";

      let index = 0;
      let timerId = null;

      const getStepPx = () => carousel.clientWidth; // viewport 寬度
      const goTo = (i) => {
        index = (i + slides.length) % slides.length;
        const x = -index * getStepPx();
        track.style.transform = `translateX(${x}px)`;
      };

      const start = () => {
        stop();
        timerId = window.setInterval(() => goTo(index + 1), interval);
      };

      const stop = () => {
        if (timerId !== null) {
          window.clearInterval(timerId);
          timerId = null;
        }
      };

      // 分頁不可見暫停
      const onVisibilityChange = () => {
        if (document.hidden) stop();
        else start();
      };
      visibilityHandlers.push(onVisibilityChange);

      // 視窗尺寸改變時，重新對齊目前那一張（確保自適應）
      const onResize = () => goTo(index);
      resizeHandlers.push(onResize);

      // 初始化
      goTo(0);
      start();
    });

    // 只綁一次 document/window listener
    if (visibilityHandlers.length) {
      document.addEventListener("visibilitychange", () => {
        visibilityHandlers.forEach((fn) => fn());
      });
    }
    if (resizeHandlers.length) {
      window.addEventListener("resize", () => {
        resizeHandlers.forEach((fn) => fn());
      });
    }
  }

  /* ---------------------------------------
   * 2) Mobile Image Modal for other-photo
   * --------------------------------------- */
  const modal = document.getElementById("imageModal");
  if (!modal) return; // 沒放 modal HTML 就不啟用

  const modalImg = modal.querySelector("img");
  const closeBtn = modal.querySelector(".image-modal__close");
  const backdrop = modal.querySelector(".image-modal__backdrop");

  if (!modalImg || !closeBtn || !backdrop) return;

  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

  const openModal = (src, alt = "") => {
    modalImg.src = src;
    modalImg.alt = alt || "Preview image";
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    modalImg.alt = "";
    document.body.style.overflow = "";
  };

  // 只綁定 .other-photo img
  document.querySelectorAll(".other-photo img").forEach((img) => {
    img.addEventListener("click", () => {
      if (!isMobile()) return;
      openModal(img.currentSrc || img.src, img.alt || "");
    });
  });

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  // 可選：ESC 關閉（桌機雖然不開 modal，但保留無害）
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
})()