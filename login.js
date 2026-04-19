const toggleSwitch = document.getElementById('toggleSwitch');
const userForm = document.getElementById('userForm');
const adminForm = document.getElementById('adminForm');
const mainTitle = document.getElementById('mainTitle');
const userOption = document.getElementById('userOption');
const adminOption = document.getElementById('adminOption');
var isUser = false;
const supabaseUrl = 'https://mulbvyywnrlqlqvgjtzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bGJ2eXl3bnJscWxxdmdqdHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDE1MjQsImV4cCI6MjA5MjAxNzUyNH0.IeS8h8ptvZJoFU_pR7JuCQooAp4lxw2TFTwn7zZV8Uc';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

async function buildPage(event) {
    event.preventDefault(); // منع تحديث الصفحة
    
    // فحص هل المفتاح على وضع الأدمن أم اليوزر
    const isAdminActive = toggleSwitch.classList.contains('admin-active');
    
    let email, password;
    
    if (isAdminActive) {
        // سحب البيانات من فورم الأدمن
        email = document.getElementById('admin-id').value;
        password = document.getElementById('admin-pass').value;
    } else {
        // سحب البيانات من فورم اليوزر
        email = document.getElementById('user-id').value;
        password = document.getElementById('user-pass').value;
    }

    // محاولة تسجيل الدخول الفعلية عبر Supabase
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("خطأ في الدخول: الإيميل أو كلمة المرور غير صحيحة.");
        console.error("Auth Error:", error.message);
        return;
    }
    // إذا نجح الدخول، يتم التوجيه بناءً على الحالة
    if (isAdminActive) {
        const user_id = data.user.id;

        const{adminData, adminError} = await supabaseClient.from('admin').select('id').eq('id',user_id );
        if (!adminData) {
            await supabaseClient.auth.signOut();
            alert("You don't have an Authorization to accsess");
            return;
            
        }
        window.location.href = "adminPage.html";
    } else {
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