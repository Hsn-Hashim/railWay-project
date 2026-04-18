const toggleSwitch = document.getElementById('toggleSwitch');
const userForm = document.getElementById('userForm');
const adminForm = document.getElementById('adminForm');
const mainTitle = document.getElementById('mainTitle');
const userOption = document.getElementById('userOption');
const adminOption = document.getElementById('adminOption');
var isUser = false;
const supabaseUrl = 'https://mulbvyywnrlqlqvgjtzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bGJ2eXl3bnJscWxxdmdqdHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDE1MjQsImV4cCI6MjA5MjAxNzUyNH0.IeS8h8ptvZJoFU_pR7JuCQooAp4lxw2TFTwn7zZV8Uc';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

function buildPage(event) {
    event.preventDefault();
    // نمسك حاوية التبديل لنعرف الحالة الحالية
    const toggleSwitch = document.getElementById('toggleSwitch');
    
    // نفحص هل كلاس 'admin-active' موجود حالياً؟
    const isAdminActive = toggleSwitch.classList.contains('admin-active');

    if (isAdminActive) {
        // إذا كان المفتاح على الأدمن، وجهه لصفحة الإدارة
        window.location.href = "adminPage.html";
    } else {
        // إذا كان على اليوزر، وجهه لصفحة المستخدم
        window.location.href = "userPage.html";
    }
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