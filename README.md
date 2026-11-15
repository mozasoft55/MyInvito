# Wedding Card — Royal Digital Wedding Invitation Platform

An ultra-premium, interactive digital wedding invitation card web application with dynamic countdowns, authentic cultural & religious themes (Hindu, Muslim, Sikh, Bengali, etc.), custom foil scratch reveals, RSVP system, and automated WhatsApp guest invitation links.

## 🌟 Key Features
- **14 Royal Invitation Templates**: Rajmahal Jharokha, Monsoon Majesty, Islamic Shadi, Royal Arch, Lotus Darbar, Bengali Hindu, Royal Temple Palace, and more.
- **Dynamic Cultural Invocation**: Predefined religious dropdown and custom ceremony titles.
- **High-Contrast Royal Color Palettes**: Deep velvet jewel nights (`maroon`, `emerald`, `navy`, `rose`) with zero washout.
- **Multi-Language Support**: Complete localization in English, Bengali, Hindi, and Urdu (`i18n.js`).
- **Interactive Studio**: Live invitation preview and customization studio (`studio.html`).
- **Interactive Scratch & Phuljhari Celebration**: Realistic canvas scratch reveals with festive golden sparkler / cracker particle physics.
- **Curated & Custom Audio Soundtrack**: Integrated music picker with curated royalty-free wedding melodies and custom MP3 upload support.
- **Guest Link Generator & QR Codes**: Automated WhatsApp personalized invite messages (`guest-list.html`).
- **Admin & Verification**: Customer dashboard and admin payment review (`admin/`, `dashboard/`).

## 📁 Repository Structure
- `Invite/` — Main web application suite (templates 01–14, assets, onboarding, dashboard, admin, studio).
- `index.html` — Smart entry router forwarding guest invite codes seamlessly to `./Invite/`.

## 🚀 Quick Start
Open `Invite/studio.html` to preview and customize templates, or run unit tests:
```bash
npm test --prefix Invite
```
