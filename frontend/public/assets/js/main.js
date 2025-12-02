$(document).ready(function ($) {
    "use strict";

    // Khởi tạo Swiper cho phần đặt bàn nếu phần tử tồn tại
    if ($(".book-table-img-slider").length) {
        var book_table = new Swiper(".book-table-img-slider", {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
            speed: 2000,
            effect: "coverflow",
            coverflowEffect: {
                rotate: 3,
                stretch: 2,
                depth: 100,
                modifier: 5,
                slideShadows: false,
            },
            loopAdditionSlides: true,
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
        });
    }

    // Khởi tạo Swiper cho phần slider nhóm nếu phần tử tồn tại
    if ($(".team-slider").length) {
        var team_slider = new Swiper(".team-slider", {
            slidesPerView: 3,
            spaceBetween: 30,
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
            speed: 2000,
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
            breakpoints: {
                0: {
                    slidesPerView: 1.2,
                },
                768: {
                    slidesPerView: 2,
                },
                992: {
                    slidesPerView: 3,
                },
                1200: {
                    slidesPerView: 3,
                },
            },
        });
    }

    // Bộ lọc menu nếu phần tử .filters tồn tại
    if ($(".filters").length) {
        $(".filters").on("click", function () {
            $("#menu-dish").removeClass("bydefault_show");
        });

        $(function () {
            var filterList = {
                init: function () {
                    $("#menu-dish").mixItUp({
                        selectors: {
                            target: ".dish-box-wp",
                            filter: ".filter",
                        },
                        animation: {
                            effects: "fade",
                            easing: "ease-in-out",
                        },
                        load: {
                            filter: ".all, .breakfast, .lunch, .dinner",
                        },
                    });
                },
            };
            filterList.init();
        });
    }

    // Toggle menu nếu menu toggle tồn tại
    if ($(".menu-toggle").length) {
        $(".menu-toggle").click(function () {
            $(".main-navigation").toggleClass("toggled");
        });

        $(".header-menu ul li a").click(function () {
            $(".main-navigation").removeClass("toggled");
        });
    }

    // Khởi tạo ScrollTrigger nếu thư viện gsap tồn tại
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        var elementFirst = document.querySelector('.site-header');
        if (elementFirst) {
            ScrollTrigger.create({
                trigger: "body",
                start: "30px top",
                end: "bottom bottom",
                onEnter: () => myFunction(),
                onLeaveBack: () => myFunction(),
            });

            function myFunction() {
                elementFirst.classList.toggle('sticky_head');
            }
        }
    }

    // Khởi tạo parallax nếu phần tử .js-parallax-scene tồn tại
    var scene = $(".js-parallax-scene").get(0);
    if (scene) {
        var parallaxInstance = new Parallax(scene);
    }

    // Mở và đóng modal cho Đăng Nhập nếu nút login tồn tại
    function openLoginModal() {
        const loginModal = document.getElementById("loginModal");
        if (loginModal) {
            loginModal.style.display = "block";
        }
    }

    function closeLoginModal() {
        const loginModal = document.getElementById("loginModal");
        if (loginModal) {
            loginModal.style.display = "none";
        }
    }

    window.addEventListener("click", function(event) {
        const modal = document.getElementById("loginModal");
        if (modal && event.target === modal) {
            modal.style.display = "none";
        }
    });

    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', openLoginModal);
    }

    // Toggle menu tài khoản khi nhấn vào biểu tượng người dùng nếu profile icon tồn tại
    function toggleProfileMenu() {
        const profileMenu = document.getElementById("profileMenu");
        if (profileMenu) {
            profileMenu.style.display = profileMenu.style.display === "block" ? "none" : "block";
        }
    }

    const profileIcon = document.querySelector(".profile-icon");
    if (profileIcon) {
        profileIcon.addEventListener("click", toggleProfileMenu);
    }

    window.addEventListener("click", function(event) {
        const profileMenu = document.getElementById("profileMenu");
        if (profileMenu && profileIcon) {
            if (event.target !== profileIcon && !profileIcon.contains(event.target) &&
                event.target !== profileMenu && !profileMenu.contains(event.target)) {
                profileMenu.style.display = "none";
            }
        }
    });
});

jQuery(window).on('load', function () {
    $('body').removeClass('body-fixed');

    // Kích hoạt tab của bộ lọc nếu các filter tồn tại
    if ($(".filter").length) {
        let targets = document.querySelectorAll(".filter");
        let activeTab = 0;
        let old = 0;
        let dur = 0.4;
        let animation;

        for (let i = 0; i < targets.length; i++) {
            targets[i].index = i;
            targets[i].addEventListener("click", moveBar);
        }

        // Đặt vị trí ban đầu trên tab đầu tiên
        gsap.set(".filter-active", {
            x: targets[0].offsetLeft,
            width: targets[0].offsetWidth
        });

        function moveBar() {
            if (this.index != activeTab) {
                if (animation && animation.isActive()) {
                    animation.progress(1);
                }
                animation = gsap.timeline({
                    defaults: {
                        duration: 0.4
                    }
                });
                old = activeTab;
                activeTab = this.index;
                animation.to(".filter-active", {
                    x: targets[activeTab].offsetLeft,
                    width: targets[activeTab].offsetWidth
                });

                animation.to(targets[old], {
                    color: "#0d0d25",
                    ease: "none"
                }, 0);
                animation.to(targets[activeTab], {
                    color: "#fff",
                    ease: "none"
                }, 0);
            }
        }
    }
});
