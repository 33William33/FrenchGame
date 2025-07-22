document.addEventListener('DOMContentLoaded', function() {
    const signinForm = document.getElementById('signin-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterBtn = document.getElementById('show-register-btn');
    const showSigninBtn = document.getElementById('show-signin-btn');
    
    // Show register form and hide signin form
    showRegisterBtn.addEventListener('click', function() {
        signinForm.classList.remove('show');
        registerForm.classList.add('show');
        showRegisterBtn.style.display = 'none';
        showSigninBtn.style.display = 'inline-flex';
    });
    
    // Show signin form and hide register form
    showSigninBtn.addEventListener('click', function() {
        registerForm.classList.remove('show');
        signinForm.classList.add('show');
        showSigninBtn.style.display = 'none';
        showRegisterBtn.style.display = 'inline-flex';
    });
});
