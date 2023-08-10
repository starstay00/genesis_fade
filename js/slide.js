(function($){
    const obj = {
        init(){
            this.header();
            this.section1();
            this.section2();
            this.section3();
        },
        header(){},
        section1(){
            let cnt=0;
            let setId=0;
            const slideContainer=$('#section1 .slide-container');
            const slideWrap=$('#section1 .slide-wrap');
            const slideView=$('#section1 .slide-view');
            const slide=$('#section1 .slide-view .slide');
            const slideImg=$('#section1 .slide-view .slide img');
            const pageBtn=$('#section1 .page-btn');
            const stopBtn=$('#section1 .stop-btn');
            const playBtn=$('#section1 .play-btn');
            const n=$('#section1 .slide').length-1; // 10개 이미지 (실제로 사용되는 번호는 0~9)
            let mouseDown = null;
            let mouseUp = null;
            let dragStart = null;
            let dragEnd = null;
            let mDown = false;
            let winWidth = $(window).innerWidth();
            let sizeX = 10;

            // 1. 슬라이드 창크기에 반응하는 이미지 크기 반응형 만들기
            //    ? = 2560(이미지크기) / 1903(창크기) : 최초 기준비율 고정값 구하기
            const imgRate = 1.3452443510247;

            // 2. 이미지 trnaslateX(-324px) 반응형 적용하기
            //    ? = 324(크롭이미지크기) / 2560(이미지크기) : 최초 기준비율 고정값 구하기
            const transRate = 0.1265625;

            // 이미지크기 width = 이미지 비율 * 창넓이             
            // translateX(-?px)
            slideImg.css({width: imgRate * winWidth, transform:`translateX(${-(imgRate*winWidth)*transRate}px)`});

            // 반응형
            $(window).resize(function(){
                winWidth = $(window).innerWidth(); // 창 크기 변할 때마다 계산되어야 함
                slideImg.css({width: imgRate * winWidth, transform:`translateX(${-(imgRate*winWidth)*transRate}px)`});
            })

            // 터치 스와이프 이벤트
                // 마우스 터치 스와이프 / 드래그 앤 드롭 이벤트 : 데스크탑
            slideContainer.on({
                mousedown(e){
                    winWidth = $(window).innerWidth();
                    mouseDown = e.clientX;
                    dragStart = e.clientX - (slideWrap.offset().left + winWidth);
                    mDown = true;
                    slideView.css({cursor:'grabbing'});
                },
                mouseup(e){
                    mouseUp = e.clientX;
                    if(mouseDown-mouseUp > sizeX){
                        clearInterval(setId); // 클릭시 일시중지
                        if(!slideWrap.is(':animated')){
                            nextCount();
                        }
                    }
                    if(mouseDown-mouseUp < -sizeX){
                        clearInterval(setId);
                        if(!slideWrap.is(':animated')){
                            prevCount();
                        }
                    }
                    if(mouseDown-mouseUp >= -sizeX && mouseDown-mouseUp <= sizeX){
                        mainSlide();
                    }
                    mDown = false;
                    slideView.css({cursor:'grab'});
                }
            })

                $(document).on({
                    mouseup(e){
                        if(!mDown) return; 
                        mouseUp = e.clientX;
                        if(mouseDown-mouseUp > sizeX){
                            clearInterval(setId); // 클릭시 일시중지
                            if(!slideWrap.is(':animated')){
                                nextCount();
                            }
                        }
                        if(mouseDown-mouseUp < -sizeX){
                            clearInterval(setId);
                            if(!slideWrap.is(':animated')){
                                prevCount();
                            }
                        }
                        if(mouseDown-mouseUp >= -sizeX && mouseDown-mouseUp <= sizeX){
                            mainSlide();
                        }
                        mDown = false;
                        slideView.css({cursor:'grab'});
                    }
                })

            // 손가락 터치 스와이프 / 드래그 앤 드롭 이벤트 : 태블릿 & 모바일 태블릿 => 모바일에서만 이벤트 동작
            // originalEvent: TouchEvent, type: 'touchstart'
            slideContainer.on({
                touchstart(e){       // = mousedown
                    //console.log(e.originalEvent.changedTouches[0].clientX);
                    winWidth = $(window).innerWidth();
                    sizeX = winWidth /3;
                    mouseDown = e.originalEvent.changedTouches[0].clientX;
                    dragStart = e.originalEvent.changedTouches[0].clientX - (slideWrap.offset().left + winWidth);
                    mDown = true;
                    slideView.css({cursor:'grabbing'});
                }, 
                touchend(e){        // = mouseup
                    //console.log(e.originalEvent.changedTouches[0].clientX);
                    mouseUp = e.originalEvent.changedTouches[0].clientX;
                    if(mouseDown-mouseUp > sizeX){
                        clearInterval(setId); // 클릭시 일시중지
                        if(!slideWrap.is(':animated')){
                            nextCount();
                        }
                    }
                    if(mouseDown-mouseUp < -sizeX){
                        clearInterval(setId);
                        if(!slideWrap.is(':animated')){
                            prevCount();
                        }
                    }
                    if(mouseDown-mouseUp >= -sizeX && mouseDown-mouseUp <= sizeX){
                        mainSlide();
                    }
                    mDown = false;
                    slideView.css({cursor:'grab'});
                } 
            });

            // 페이드 인 / 아웃 효과 애니메이션 슬라이드 구현
            //  - 모든 슬라이드는 position:absolute;
            //  - 맨 위, 아래 포개진 슬라이드 앞 뒤/순서를 정함 : z-index: 3, 2, 1
            //  - 페이드 아웃 효과는 opacity : 0, 시간은 0.6s ~ 1s
            //  - 10개 슬라이드를 반복적으로 회전하여 순서대로 보여줌
            mainNextSlide();

            // 메인 다음 슬라이드 함수(다음 페이드인아웃)
            function mainNextSlide(){
                slide                         .css({zIndex:1, opacity:1});
                slide.eq(cnt)                 .css({zIndex:2});                                                           // 다음 슬라이드
                // cnt = 0 이면 마지막 슬라이드 번호 9, 그렇지 않으면 cnt-1
                slide.eq(cnt===0 ? n : cnt-1) .css({zIndex:3}).stop().animate({opacity:1}, 0).animate({opacity:0}, 1000); // 현재 슬라이드
                pageEvent();
            }

            // 메인 이전 슬라이드 함수(이전 페이드인아웃)
            function mainPrevSlide(){
                slide                         .css({zIndex:1, opacity:1});
                slide.eq(cnt===n ? 0 : cnt+1) .css({zIndex:2});                                                           // 다음 슬라이드
                slide.eq(cnt)                 .css({zIndex:3}).stop().animate({opacity:0}, 0).animate({opacity:1}, 1000); // 현재 슬라이드
                pageEvent();
            }

            function nextCount(){
                cnt++;
                if(cnt>n) cnt=0;
                mainNextSlide(); // 메인 다음 슬라이드
            }

            function prevCount(){
                cnt--;
                if(cnt<0) cnt=n;
                mainPrevSlide(); // 메인 이전 슬라이드
            }

            function autoTimer(){
                setId = setInterval(nextCount, 4000);
            }
            autoTimer();

            function pageEvent(){
                pageBtn.removeClass('on');
                pageBtn.eq(cnt>n?0:cnt).addClass('on');
            }

            pageBtn.each(function(idx){
                $(this).on({
                    click(e){
                        e.preventDefault();
                        cnt=idx;
                        mainSlide();
                        clearInterval(setId);
                    }
                });
            });

            stopBtn.on({
                click(e){
                    e.preventDefault();
                    stopBtn.addClass('on');
                    playBtn.addClass('on');
                    clearInterval(setId);
                }
            })

            playBtn.on({
                click(e){
                    e.preventDefault();
                    stopBtn.removeClass('on');
                    playBtn.removeClass('on');
                    autoTimer();
                }
            })
        },

        section2(){
            // 0. 변수설정
            let cnt = 0;
            const section2Container = $('#section2 .container');
            const slideContainer = $('#section2 .slide-container');
            const slideWrap = $('#section2 .slide-wrap');
            const slideView = $('#section2 .slide-view');
            const slide = $('#section2 .slide-view .slide');
            const slideH3 = $('#section2 .slide-view .slide h3');
            const slideH4 = $('#section2 .slide-view .slide h4');
            const pageBtn = $('#section2 .page-btn');
            const selectBtn = $('#section2 .select-btn');
            const subMenu = $('#section2 .sub-menu');
            const materialIcons = $('#section2 .select-btn .material-icons');
            const heightRate = 0.884545392; // 슬라이드 넓이에 대한 높이 비율
            let n = slide.length -2; // 10개 

            // 터치스와이프
            let touchStart = null;
            let touchEnd = null;

            let dragStart = null;
            let dragEnd = null;
            let mDown = false;
            let winWidth = $(window).innerWidth();
            let sizeX = 200;
            let offsetL = slideWrap.offset().left;
            let slideWidth;

            // console.log(slideWrap.offset().left); 좌측 좌표값

            resizeFn(); // 로딩시
            
            // 함수는 명령어의 묶음
            function resizeFn(){
                winWidth = $(window).innerWidth(); // 실시간 창 크기 값 보여줌
                // 창 넓이 1642px 이하에서 padding :0 으로 설정
                if(winWidth <= 1642) {// 이하 winWidth <= 1642
                    if(winWidth > 1280) { //1280px 초과는 슬라이드 3개
                        slideWidth = (section2Container.innerWidth() - 0 + 20 + 20)/3;
                        n = slide.length - 2; // 8=10-2
                        // 페이지 버튼 갯수 제어 : 8개 / 10개인 경우
                        pageBtn.css({display:'none'}); // 페이지 버튼 모두 숨김
                        for(let i=0; i<n; i++){
                            pageBtn.eq(i).css({display:'block'}); // 페이지 버튼 8개 보임
                        }
                        if(cnt>=n-1){ // 페이지 버튼이 8(배열 7),9(배열 8),10(배열 9) 번 일때 8번 위치로 이동
                            cnt=n-1;
                        }
                    }
                    else { // 1280px 이하는 슬라이드 1개,
                        slideWidth = (section2Container.innerWidth() - 0 + 20 + 20)/1;
                        n = slide.length; // 10
                        pageBtn.css({display:'block'}); // 페이지 버튼 10개 보임
                    }
                }
                else { // 1642px 초과
                    slideWidth = (section2Container.innerWidth() - 198 + 20 + 20)/3;
                    pageBtn.css({display:'none'}); // 페이지 버튼 모두 숨김
                    for(let i=0; i<n; i++){
                        pageBtn.eq(i).css({display:'block'}); // 페이지 버튼 8개 보임
                    }
                }
                slideWrap.css({width:slideWidth * 10});
                slide.css({width:slideWidth, height:slideWidth * heightRate});
                slideH3.css({fontSize:slideWidth * 0.07});
                slideH4.css({fontSize:slideWidth * 0.03});

                mainSlide(); // 슬라이드에 슬라이드 넓이를 전달하기 위해 호출
            }

            // 가로 세로 크기가 1px만 이라도 변경되면 실행, 크기 변경안되면 실행되지 않음
            $(window).resize(function(){
                resizeFn();
            });

            // 데스크탑 : 터치 스와이프, 드래그앤드롭
            slideContainer.on({
                mousedown(e){
                    touchStart = e.clientX;
                    dragStart = e.clientX - (slideWrap.offset().left - offsetL);
                    mDown = true;
                    slideView.css({cursor:'grabbing'});
                },                
                mouseup(e){
                    touchEnd = e.clientX;
                    if(touchStart-touchEnd > sizeX){
                        nextCount();
                    }
                    if(touchStart-touchEnd < -sizeX){
                        prevCount();
                    }
                    mDown = false; 
                    if(touchStart-touchEnd >= -sizeX && touchStart-touchEnd <= sizeX){
                        mainSlide();
                    }
                    slideView.css({cursor:'grab'});
                },
                mousemove(e){
                    if(!mDown) return;
                    dragEnd = e.clientX;
                    slideWrap.css({left:dragEnd-dragStart});
                    if(touchStart-touchEnd >= -sizeX && touchStart-touchEnd <= sizeX){
                        mainSlide();
                    }
                }
            });

            $(document).on({
                mouseup(e){
                    // mDown = true; 상태에서 
                    // mouseup에서 mDown = false; 변경
                    // 이미 실행되었으므로 실행 못하게 막아야 한다
                    if(!mDown) return; // 마우스 다운상태에서 마우스업이 실행 안된상태
                    touchEnd = e.clientX;
                    if(touchStart-touchEnd > sizeX){
                        nextCount();
                    }
                    if(touchStart-touchEnd < -sizeX){
                        prevCount();
                    }
                    mDown = false;
                    slideView.css({cursor:'grab'});
                }
            })

            //태블릿, 모바일 : 터치 스와이프, 드래그앤드롭
            slideContainer.on({
                touchstart(e){  // 이벤트는 대/소문자 구분없음, 모두 소문자
                    touchStart = e.originalEvent.changedTouches[0].clientX;
                    dragStart = e.originalEvent.changedTouches[0].clientX - (slideWrap.offset().left - offsetL);
                    mDown = true;
                    slideView.css({cursor:'grabbing'});
                },                
                touchend(e){
                    touchEnd = e.originalEvent.changedTouches[0].clientX;
                    if(touchStart-touchEnd > sizeX){
                        nextCount();
                    }
                    if(touchStart-touchEnd < -sizeX){
                        prevCount();
                    }
                    mDown = false; 
                    if(touchStart-touchEnd >= -sizeX && touchStart-touchEnd <= sizeX){
                        mainSlide();
                    }
                    slideView.css({cursor:'grab'});
                },
                touchmove(e){
                    if(!mDown) return;
                    dragEnd = e.originalEvent.changedTouches[0].clientX;
                    slideWrap.css({left:dragEnd-dragStart});
                    if(touchStart-touchEnd >= -sizeX && touchStart-touchEnd <= sizeX){
                        mainSlide();
                    }
                }
            });

            // 다음 카운트 함수
            function nextCount(){
                cnt++;
                if(cnt>n-1){cnt=n-1};
                mainSlide();
            }
            // 이전 카운트 함수
            function prevCount(){
                cnt--;
                if(cnt<0){cnt=0};
                mainSlide();
            }

            // 셀렉트 버튼 클릭 이벤트
            // 셀렉트 버튼 한번 클릭하면 서브메뉴 보이고
            // 또 한번 클릭하면 서브메뉴 숨김 => toggle
            selectBtn.on({
                click(e){
                    e.preventDefault();
                    subMenu.toggleClass('on'); // 서브메뉴
                    materialIcons.toggleClass('on'); // 아이콘
                }
            })

            // 1. 메인슬라이드 함수
            mainSlide();
            function mainSlide(){
                slideWrap.stop().animate({left:-slideWidth * cnt}, 600, 'easeInOutExpo'); // css에서 slide-wrap항목에 position:relative; left:0; 설정해줘야 함
                pageBtnEvent();
            }
                // function mainSlide(){
                //     slideWrap.css({transition:`all 0.6s ease-in-out`});
                //     slideWrap.css({transform:`translateX(${-488.328*cnt}px)`});
                //     pageBtnEvent();
                // }

            // 2. 페이지버튼 클릭이벤트
            // each() 메서드
            pageBtn.each(function(idx){
                $(this).on({
                    click(e){
                        e.preventDefault();
                        cnt=idx;
                        mainSlide();
                    }
                })
            });
            // 3. 페이지버튼 이벤트 함수
            function pageBtnEvent(){
                pageBtn.removeClass('on');
                pageBtn.eq(cnt).addClass('on');
            }
        },
        section3(){}
        }
    obj.init();
})(jQuery);