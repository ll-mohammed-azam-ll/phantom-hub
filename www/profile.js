/* =========================================
   PHANTOM PROFILE SYSTEM
========================================= */

import { ref, update, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const CLOUDINARY_UPLOAD_PRESET = "Phantom_messaging";

/* =========================================
   INIT PROFILE
========================================= */

export function initProfileSystem(){

    const myUid = window.CURRENT_SESSION?.uid;
    if(!myUid) return;

    syncProfile(myUid);

    renderAvatars();
    setupBioEditor();
    setupPfpUpload();
}


/* =========================================
   REALTIME PROFILE SYNC
========================================= */

function syncProfile(uid){

    const userRef = ref(window.rtdb, `global_users/${uid}`);

    onValue(userRef, (snap)=>{

        const data = snap.val();
        if(!data) return;

     const pfpImg = document.getElementById("user-pfp");
const initials = document.getElementById("pfp-initials");

if (pfpImg && initials) {
    if (data.profile_pic) {
        pfpImg.src = data.profile_pic;// cache refresh
        pfpImg.classList.remove("hidden");
        initials.classList.add("hidden");
    }
}

        if(document.getElementById("user-display-name"))
            document.getElementById("user-display-name").innerText = data.username || "User";

        if(document.getElementById("info-username"))
            document.getElementById("info-username").innerText = "@"+(data.username || "user");

        if(document.getElementById("bio-preview"))
            document.getElementById("bio-preview").innerText = data.bio || "Tap to edit your story...";

        if(document.getElementById("bio-textarea"))
            document.getElementById("bio-textarea").value = data.bio || "";

        if(document.getElementById("current-note"))
            document.getElementById("current-note").innerText = data.note || "Set status...";
    });
}



/* =========================================
   AVATAR RENDERER (DiceBear)
========================================= */

function renderAvatars(){

    const list = document.getElementById('avatar-list');
    if(!list) return;

    list.innerHTML = "";

    for(let i=1;i<=10;i++){

        const seed = `phantom-${i}`;
        const url = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${seed}`;

        const avatarDiv = document.createElement('div');

        avatarDiv.className =
        "min-w-[60px] h-[60px] rounded-xl bg-neutral-900 border border-white/10 cursor-pointer hover:border-[#D4AF37] transition-all overflow-hidden p-1";

        avatarDiv.innerHTML =
        `<img src="${url}" class="w-full h-full object-contain">`;

        avatarDiv.onclick = ()=>selectAvatar(url);

        list.appendChild(avatarDiv);
    }
}



/* =========================================
   SELECT AVATAR
========================================= */

async function selectAvatar(url){

    const pfpImg = document.getElementById('user-pfp');
    const initials = document.getElementById('pfp-initials');

    pfpImg.src = url;
    pfpImg.classList.remove('hidden');
    initials.classList.add('hidden');

    const myUid = window.CURRENT_SESSION.uid;

    await update(
        ref(window.rtdb, `global_users/${myUid}`),
        { profile_pic: url }
    );
}



/* =========================================
   BIO EDITOR
========================================= */

function setupBioEditor(){

    const saveBtn = document.getElementById('save-bio-btn');
    const textarea = document.getElementById('bio-textarea');
    const preview = document.getElementById('bio-preview');

    if(!saveBtn) return;

    saveBtn.onclick = async ()=>{

        const newBio = textarea.value.trim();
        if(!newBio) return;

        saveBtn.innerText = "Syncing...";

        const myUid = window.CURRENT_SESSION.uid;

        await update(
            ref(window.rtdb, `global_users/${myUid}`),
            { bio: newBio }
        );

        preview.innerText = newBio;

        saveBtn.innerText = "Update Bio";
    };
}



/* =========================================
   PROFILE PHOTO UPLOAD (Cloudinary)
========================================= */

function setupPfpUpload(){

    const input = document.getElementById("pfp-input");
    if(!input) return;

    input.addEventListener("change", async (e) => {

        const file = e.target.files[0];
        if(!file) return;

        const myUid = window.CURRENT_SESSION?.uid;
        if(!myUid){
            alert("User session not found");
            return;
        }

        const formData = new FormData();

        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("folder", "profile_pictures");

        try {

            const res = await fetch(
                "https://api.cloudinary.com/v1_1/dkg7pyk5v/image/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await res.json();
            console.log("Cloudinary response:", data);

            if (!data.secure_url) {
                alert("Upload failed: " + (data.error?.message || "Unknown error"));
                return;
            }

            const optimizedUrl = data.secure_url.replace(
  "/upload/",
  "/upload/w_200,c_fill,q_auto,f_auto/"
) + "?v=" + Date.now();

            console.log("Saving to Firebase:", optimizedUrl);

         await update(
  ref(window.rtdb, `global_users/${myUid}`),
  { profile_pic: optimizedUrl }
);

        } catch (err) {
            console.error("Upload error:", err);
            alert("Upload failed. Check console.");
        }

    });
}







/* EXPORT TO GLOBAL */

window.initProfileSystem = initProfileSystem;
window.renderAvatars = renderAvatars;
window.selectAvatar = selectAvatar;
window.setupBioEditor = setupBioEditor;