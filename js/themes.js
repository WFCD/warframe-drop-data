/*globals $, localStorage  */
function initThemes() {
  if(localStorage.getItem('_theme')) {
    $('html').removeClass()
    $('html').addClass(localStorage.getItem('_theme'))
  }

  $('.theme-mode').click(event => {
    const target = $(event.currentTarget)
    if (target.hasClass('sun')) {
      localStorage.setItem('_theme', 'day')
      $('html').removeClass();
    } else if (target.hasClass('moon')) {
      localStorage.setItem('_theme', 'dark')
      $('html').removeClass()
      $('html').addClass('dark')
    } else if (target.hasClass('stalker')) {
      localStorage.setItem('_theme', 'stalker')
      $('html').removeClass()
      $('html').addClass('stalker')
    }
    
    if (localStorage.getItem('_theme') === 'stalker') {
      $('.logo').attr('src', '/img/stalker.png')
      $('html').removeClass()
      $('html').addClass('stalker')
    } else {
      $('.logo').attr('src', '/img/logo.short.png')
    }
  })
  
  if (localStorage.getItem('_theme') === 'stalker') {
    $('.logo').attr('src', '/img/stalker.png')
    $('html').removeClass()
    $('html').addClass('stalker')
  }
}
$(document).ready(initThemes)
