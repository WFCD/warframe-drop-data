$(document).ready(function() {
    if(localStorage.getItem('_theme')) {
        $('html').addClass(localStorage.getItem('_theme'))
    }

    $('.theme-mode').click(event => {
        const target = $(event.currentTarget)
        if (target.hasClass('moon')) {
            localStorage.removeItem('_theme');
            $('html').removeClass('dark')
        } else {
            localStorage.setItem('_theme', 'dark');
            $('html').addClass('dark')
        }
    })
})
