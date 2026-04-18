// 1. إعداد الاتصال بقاعدة البيانات (بمفاتيح مشروعك)
const supabaseUrl = 'https://mulbvyywnrlqlqvgjtzp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bGJ2eXl3bnJscWxxdmdqdHpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDE1MjQsImV4cCI6MjA5MjAxNzUyNH0.IeS8h8ptvZJoFU_pR7JuCQooAp4lxw2TFTwn7zZV8Uc';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. الدالة المرتبطة بزر التسجيل
async function registerUser(event) {
    // منع التحديث الافتراضي للصفحة عند الضغط على الزر
    event.preventDefault();

    // 3. سحب القيم المكتوبة من حقول الإدخال
    const nameInput = document.getElementById('reg-name').value;
    const nationalIdInput = document.getElementById('reg-national-id').value;
    const phoneInput = document.getElementById('reg-phone').value;
    const dobInput = document.getElementById('reg-dob').value;
    const emailInput = document.getElementById('reg-email').value;
    const passInput = document.getElementById('reg-pass').value;

    // 4. الخطوة الأولى: إنشاء الحساب وتمرير الاسم في الـ Metadata عشان يلقطه الـ Trigger
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailInput,
        password: passInput,
        options: {
            data: {
                full_name: nameInput 
            }
        }
    });

    // اعتراض الأخطاء إن وجدت (مثل إيميل مسجل مسبقاً أو باسوورد ضعيف)
    if (authError) {
        alert("خطأ في إنشاء الحساب: " + authError.message);
        return;
    }

    const newUserId = authData.user.id;

    // 5. الخطوة الثانية: تحديث الصف الذي أنشأه الزناد لإضافة باقي البيانات (الهوية، الجوال، تاريخ الميلاد)
    const { error: dbError } = await supabase
        .from('user') 
        .update({
            national_id: nationalIdInput,
            phone: phoneInput,
            bDate: dobInput 
        })
        .eq('id', newUserId);

    if (dbError) {
        console.error("فشل حفظ البيانات الإضافية:", dbError.message);
        alert("تم إنشاء الحساب لكن حدث خطأ أثناء حفظ بعض البيانات.");
        return;
    }

    // 6. إنهاء العملية بنجاح وتوجيه المستخدم
    alert("تم إنشاء الحساب بنجاح!");
    window.location.href = "sign-in.html";
}