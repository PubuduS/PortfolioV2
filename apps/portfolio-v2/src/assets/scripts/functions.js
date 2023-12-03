jQuery(document).ready(function($) {

	'use strict';
    //***************************
    // Sticky Header Function
    //***************************
	  jQuery(window).scroll(function() {
	      if (jQuery(this).scrollTop() > 170){  
	          jQuery('body').addClass("pw-sticky");
	      }
	      else{
	          jQuery('body').removeClass("pw-sticky");
	      }
	  });


       //***************************
    // Banner Functions
    //***************************
      jQuery('.banner-slider-wrapper').slick({
          slidesToShow: 1,
          slidesToScroll: 1,
          autoplay: true,
          autoplaySpeed: 3000,
          infinite: true,
          centerMode: false,
          dots: false,
          arrows:true,
          prevArrow: "<span class='slick-arrow-left'><img src='images/arrow-left.svg' alt=''></span>",
          nextArrow: "<span class='slick-arrow-right'><img src='images/arrow-right.svg' alt=''></span>",
          fade: true,
          responsive: [
                {
                  breakpoint: 1024,
                  settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    infinite: true,
                  }
                },
                {
                  breakpoint: 800,
                  settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                  }
                },
                {
                  breakpoint: 600,
                  settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                  }
                }
              ]
        });

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

    Tu.tScroll({
      't-element': '.fadeLeft,.fadeRight,.fadeIn,.bounceOut,.zoomOut,.slideDown,.fadeUp,.fadeDown'
    });

    //***************************
    // Progressbar Function
    //***************************
    jQuery('.progressbar1').progressBar({
      percentage : false,
      animation : true,
      backgroundColor : "rgb(10,25,47,0.2)",
      barColor : "#0A192F",
      height : "20",
    });

jQuery(window).scroll(function() {
    if (jQuery(this).scrollTop() > 300){  
        jQuery('.backtop').addClass("visibility");
    }
    else{
        jQuery('.backtop').removeClass("visibility");
    }
});

jQuery('.backtop').on("click", function() {
      jQuery('html, body').animate({
          scrollTop: 0
      }, 2000);
      return false;
  });

// End
});

// Add smooth scrolling to all links
  $("a.bottom-scroll").on('click', function(event) {
    if (this.hash !== "") {
      event.preventDefault();
      var hash = this.hash;
      $('html, body').animate({
        scrollTop: $(hash).offset().top
      }, 1000, function(){
      });
      return false;
    } // End if
  });

var sectionArray = [1, 2, 3, 4, 5, 6];

$.each(sectionArray, function(index, value){    
     $(document).scroll(function(){
         var offsetSection = $('#' + 'section_' + value).offset().top;
         var docScroll = $(document).scrollTop();
         var docScroll1 = docScroll + 1;
         if ( docScroll1 >= offsetSection ){
             $('li a').removeClass('active');
             $('li a:link').addClass('inactive');  
             $('li a').eq(index).addClass('active');
             $('li a:link').eq(index).removeClass('inactive');
         }
     });
    
    $('li a').eq(index).click(function(e){
        var offsetClick = $('#' + 'section_' + value).offset().top;
        e.preventDefault();
        $('html, body').animate({
            'scrollTop':offsetClick
        }, 1000) 
    });
});

$(document).ready(function(){
    $('li a:link').addClass('inactive');    
    $('li a').eq(0).addClass('active');
    $('li a:link').eq(0).removeClass('inactive');
    


});