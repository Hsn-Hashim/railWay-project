const toggleSwitch = document.getElementById('toggleSwitch');
const userForm = document.getElementById('userForm');
const adminForm = document.getElementById('adminForm');
const mainTitle = document.getElementById('mainTitle');
const userOption = document.getElementById('userOption');
const adminOption = document.getElementById('adminOption');
var isUser = false;

function buildPage(){
    if(isUser)
        window.location.href ="userPage.html" ;
    else
        window.location.href = "adminPage.html";


}
toggleSwitch.addEventListener('click', () => {
    // تبديل الكلاسات عند الضغط
    const isAdmin = toggleSwitch.classList.toggle('admin-active');
    
    if (isAdmin) {
        // إخفاء فورم المستخدم وإظهار الأدمن
        userForm.classList.add('hidden');
        adminForm.classList.remove('hidden');
        isUser = false;
        
        // تحديث النصوص والنشاط
        mainTitle.innerText = "Welcome Admin!";
        adminOption.classList.add('active');
        userOption.classList.remove('active');
    } else {
        // العكس عند العودة للمستخدم
        userForm.classList.remove('hidden');
        adminForm.classList.add('hidden');
        
        mainTitle.innerText = "Welcome to Smart RailWay!";
        userOption.classList.add('active');
        adminOption.classList.remove('active');
        isUser= true;
    }
});