export function header(){

    // Selects the hamburger icon and mobile menu
    const menu_btn = document.querySelector('.hamburger');
    const mobile_menu = document.querySelector('.mobile-nav');

    // Adds an event listener that makes the mobile menu appear when clicked
    menu_btn.addEventListener('click', function (){
        menu_btn.classList.toggle('is-active');
        mobile_menu.classList.toggle('is-active');
    })
}