PORTFOLIO ACCESS SETUP

FILES
- index.html   = PUBLIC VIEWER. Anyone can open it, but visitors cannot edit/upload/delete.
- editor.html  = PRIVATE OWNER EDITOR. Use this only on your own computer. Do NOT upload it.
- style.css    = design
- script.js    = website behavior
- content.json = published portfolio data
- uploads/     = published pictures/files

IMPORTANT SECURITY NOTE
This is a static HTML/CSS/JavaScript portfolio. A static website cannot securely identify you
as the owner without a server-side login/authentication system. Therefore this version uses the
safe static-site approach:

1. Visitors use index.html only.
2. You edit your portfolio using editor.html on your own computer.
3. You export the updated public package.
4. You upload only the public files (index.html, style.css, script.js, content.json, uploads/)
   to your hosting service.
5. NEVER upload editor.html.

There is NO ?admin URL anymore. Adding ?admin to the public URL does not enable editing.

HOW TO EDIT
1. Keep this project folder on your computer.
2. Open editor.html in your browser.
3. Upload pictures/files in Quiz, Long Quiz, Midterms, Finals, Activity, and Project.
4. Edit your name, bio, course/year, school and email.
5. Click "Export Public Site".
6. The downloaded portfolio-content.zip contains the updated content.json and uploads folder.
7. Replace the old content.json and uploads folder on your public host.

PUBLIC VIEW
Open index.html to preview the same read-only view that visitors will see.

IF YOU NEED TRUE ONLINE OWNER LOGIN
A secure online editor where only your account can log in and modify the live site requires
a backend/authentication service (for example Firebase/Supabase/server-side authentication).
A client-side password inside HTML/JavaScript would NOT be secure.
