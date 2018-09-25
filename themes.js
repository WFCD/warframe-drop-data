/*globals $, localStorage  */
$(document).ready(function() {
    if(localStorage.getItem('_theme')) {
        $('html').addClass(localStorage.getItem('_theme'))
    }

    $('.theme-mode').click(event => {
        const target = $(event.currentTarget)
        if (target.hasClass('sun')) {
            localStorage.removeItem('_theme')
            $('html').removeClass();
        } else if (target.hasClass('moon')) {
            localStorage.setItem('_theme', 'dark')
            $('html').addClass('dark')
        } else if (target.hasClass('stalker')) {
            localStorage.setItem('_theme', 'stalker')
            $('html').removeClass()
            $('html').addClass('stalker')
        }
        
        if (localStorage.getItem('_theme') === 'stalker') {
            $('.logo').attr('src', '/misc/stalker.png')
            $('html').removeClass()
            $('html').addClass('stalker')
        } else {
            $('.logo').attr('src', '/misc/logo.short.png')
        }
    })
    
    if (localStorage.getItem('_theme') === 'stalker') {
        $('.logo').attr('src', '/misc/stalker.png')
        $('html').removeClass()
        $('html').addClass('stalker')
    }
})
