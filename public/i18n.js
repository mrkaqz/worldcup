(function () {
  const TRANSLATIONS = {
    th: {
      page_title: 'World Cup 2026 Predictor - ทายผลฟุตบอลโลก 2026',
      // Header
      logout_title: 'ออกจากระบบ',
      login_btn: 'เข้าสู่ระบบ',
      // Tabs
      tab_predict: 'ทายผลบอล',
      tab_leaderboard: 'ตารางคะแนน & Live',
      tab_admin: 'จัดการระบบ (Admin)',
      // Login modal
      login_modal_title: 'ยืนยันตัวตนเพื่อเข้าใช้งาน',
      login_username_label: 'ชื่อผู้ใช้งาน (Username)',
      login_username_ph: 'เช่น somchai',
      login_pin_label: 'PIN เข้ารหัส (4 หลัก)',
      login_submit: 'เข้าสู่ระบบ',
      // Predict tab
      predict_section_title: 'รายการแข่งขัน & ทายผล',
      predict_lock_info: 'ปิดทายผลก่อนเริ่มแข่ง 15 นาที',
      filter_all: 'ทั้งหมด',
      filter_open: 'เปิดทายผล',
      filter_locked: 'ปิดทายผลแล้ว',
      filter_finished: 'แข่งจบแล้ว',
      loading: 'กำลังโหลดข้อมูล...',
      // Match card
      finished_label: 'จบการแข่งขัน',
      loading_time: 'โหลดเวลา...',
      view_all_predictions: 'ดูคำทายของผู้เล่นทั้งหมด',
      wins: 'ชนะ',
      draw: 'เสมอ',
      login_to_predict: 'กรุณาเข้าสู่ระบบเพื่อทำการทายผล',
      btn_predict: 'ทาย',
      btn_cancel: 'ยกเลิก',
      closes_in: 'ปิดทายใน:',
      locked_waiting: 'ปิดทายผลแล้ว (รอเริ่มแข่ง)',
      live_label: 'กำลังแข่งขัน',
      no_matches_in_filter: 'ไม่มีรายการแข่งขันในหมวดหมู่ที่เลือก',
      loading_matches: 'กำลังโหลดตารางแข่งขัน...',
      error_load_matches: 'ไม่สามารถดึงข้อมูลตารางแข่งขันได้ในขณะนี้',
      // Countdown units
      days: 'วัน', hours: 'ชม.', minutes: 'นาที', seconds: 'วิ',
      // Leaderboard
      leaderboard_title: 'ตารางคะแนนผู้เล่น (Leaderboard)',
      matrix_title: 'ตารางวิเคราะห์เปรียบเทียบ (Matrix)',
      matrix_badge: 'ทายถูก +1 คะแนน',
      matrix_desc: 'แสดงผลทายของแต่ละคนในคู่ที่ปิดรับแล้วเพื่อความโปร่งใสและร่วมลุ้นด้วยกัน',
      col_rank: 'อันดับ',
      col_player: 'ผู้ทายผล',
      col_correct: 'ทายถูก / ทั้งหมด',
      col_points: 'คะแนนรวม',
      matrix_player_col: 'ผู้เล่น',
      no_locked_matches: 'ไม่มีคู่แข่งขันที่แข่งขันหรือปิดรับผลแล้ว',
      matrix_empty_msg: 'ตารางวิเคราะห์เปรียบเทียบจะเปิดหลังจากมีคู่อย่างน้อย 1 คู่ที่เริ่มการแข่งขัน',
      loading_leaderboard: 'กำลังโหลดตารางอันดับ...',
      error_load_leaderboard: 'ไม่สามารถดึงข้อมูลตารางอันดับได้',
      no_players_leaderboard: 'ยังไม่มีรายชื่อผู้ทายผลในระบบ',
      legend_team1: 'ทีมฝั่งซ้ายชนะ (เช่น MEX)',
      legend_draw_legend: 'เสมอ (Draw)',
      legend_team2: 'ทีมฝั่งขวาชนะ (เช่น AUS)',
      legend_correct: 'ทายถูก (+1 คะแนน)',
      legend_wrong: 'ทายผิด (0 คะแนน)',
      // Round labels (short — used in match badges)
      round_group_prefix: 'กลุ่ม',
      round_group_stage: 'รอบแบ่งกลุ่ม',
      round_32: 'รอบ 32 ทีม',
      round_16: 'รอบ 16 ทีม',
      round_qf: 'รอบ 8 ทีม',
      round_sf: 'รอบรองฯ',
      round_third: 'ชิงอันดับ 3',
      round_final: 'ชิงชนะเลิศ',
      // Round option labels (admin select)
      round_opt_group: 'รอบแบ่งกลุ่ม (Group Stage)',
      round_opt_r32: 'รอบ 32 ทีม (Round of 32)',
      round_opt_r16: 'รอบ 16 ทีม (Round of 16)',
      round_opt_qf: 'รอบ 8 ทีม (Quarter-finals)',
      round_opt_sf: 'รอบรองชนะเลิศ (Semi-finals)',
      round_opt_third: 'รอบชิงอันดับ 3 (Third place)',
      round_opt_final: 'รอบชิงชนะเลิศ (Final)',
      // Admin static
      admin_players_title: 'จัดการผู้เล่น',
      admin_players_count_suffix: 'คน',
      admin_name_ph: 'ชื่อแสดง (เช่น สมชาย สุดยอด)',
      admin_username_ph: 'Username (เช่น somchai)',
      admin_pin_ph: 'PIN 4 หลัก',
      admin_add_btn: 'เพิ่ม',
      admin_col_name: 'ชื่อแสดง',
      admin_col_username: 'Username',
      admin_col_pin: 'PIN',
      admin_col_action: 'การจัดการ',
      admin_change_pin_label: 'เปลี่ยน PIN ของ Admin',
      admin_new_pin_ph: 'PIN ใหม่ 4 หลัก',
      admin_save: 'บันทึก',
      admin_matches_title: 'รายการคู่แข่ง & บันทึกผลการแข่งขัน',
      admin_add_match_btn: 'เพิ่มคู่แข่ง',
      admin_hide_form_btn: 'ซ่อนฟอร์ม',
      admin_add_match_title: 'เพิ่มคู่แข่งขันใหม่',
      admin_team1_label: 'ทีมแรก (ทีม 1)',
      admin_team1_flag_label: 'ธงทีมแรก (Emoji)',
      admin_team2_label: 'ทีมสอง (ทีม 2)',
      admin_team2_flag_label: 'ธงทีมสอง (Emoji)',
      admin_group_label: 'กลุ่ม (เช่น A, B, R16)',
      admin_round_label: 'รอบการแข่งขัน',
      admin_kickoff_label: 'เวลาแข่งขัน (ตามเวลาไทย)',
      admin_cancel: 'ยกเลิก',
      admin_save_match: 'บันทึกคู่แข่งขัน',
      admin_col_kickoff: 'เวลาแข่ง (ไทย)',
      admin_col_match: 'คู่แข่งขัน',
      admin_col_score: 'สกอร์จริง',
      admin_col_manage: 'การจัดการ',
      admin_export_title: 'ส่งออก & สำรองข้อมูล (Export & Backup)',
      admin_export_desc: 'ดาวน์โหลดข้อมูลทายผลและผลการแข่งขันทั้งหมดในรูปแบบที่ต้องการ',
      admin_export_csv_title: 'ส่งออก Excel / CSV',
      admin_export_csv_sub: 'ตารางคะแนน + ผลทายทั้งหมด',
      admin_export_json_title: 'สำรองฐานข้อมูล (JSON)',
      admin_export_json_sub: 'ไฟล์สำรองสำหรับกู้คืนระบบ',
      admin_danger_title: 'Danger Zone (พื้นที่อันตราย)',
      admin_danger_desc: 'รีเซ็ตข้อมูลคะแนน คะแนนทายผล และผู้ทายผลทั้งหมดในระบบ (บัญชีผู้ดูแลระบบ (Admin) จะไม่ถูกลบ) เพื่อเริ่มฤดูกาลแข่งขันใหม่ จากนั้นระบบจะดึงตารางแข่งขันจริงใหม่อัตโนมัติ',
      admin_reset_btn: 'ล้างข้อมูลและรีเซ็ตระบบเริ่มต้นใหม่ (Reset Predictor Data)',
      // Admin dynamic
      admin_loading_players: 'โหลดข้อมูลผู้เล่น...',
      admin_no_players: 'ไม่มีผู้เล่นในระบบ (เพิ่มผู้เล่นใหม่ได้จากฟอร์มด้านบน)',
      admin_error_load: 'ไม่สามารถดึงข้อมูลได้',
      admin_loading_matches: 'โหลดตารางแข่งขัน...',
      admin_no_matches: 'ไม่มีข้อมูลตารางแข่งขัน',
      admin_error_load_matches: 'ไม่สามารถดึงข้อมูลตารางแข่งได้',
      admin_btn_reset_score: 'ยกเลิก/รีเซ็ต',
      admin_btn_save_score: 'บันทึกผล',
      admin_btn_delete: 'ลบ',
      admin_pin_ph_small: '4 หลัก',
      // Footer
      footer_tagline: 'พัฒนาขึ้นด้วย ❤️ สำหรับความสนุกในหมู่คณะ',
      footer_time: 'เวลาในระบบขณะนี้:',
      // User roles
      role_admin: 'ผู้ดูแลระบบ (Admin)',
      role_player: 'ผู้เล่น (Player)',
      // Toast / confirm
      toast_welcome: 'ยินดีต้อนรับคุณ {name}!',
      toast_login_fail: 'เข้าสู่ระบบล้มเหลว',
      toast_server_error: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
      toast_logout: 'ออกจากระบบเรียบร้อยแล้ว',
      toast_login_required: 'กรุณาเข้าสู่ระบบก่อนทำการทายผล',
      toast_predict_success: 'ทายผลสำเร็จ!',
      toast_predict_cancel: 'ยกเลิกการทายผลสำเร็จ',
      toast_predict_fail: 'ไม่สามารถบันทึกผลการทายได้',
      toast_pin_invalid: 'PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น',
      toast_player_added: 'เพิ่มผู้เล่น {name} สำเร็จ!',
      toast_player_add_fail: 'ไม่สามารถเพิ่มผู้เล่นได้',
      toast_player_deleted: 'ลบผู้เล่น {name} สำเร็จ',
      toast_player_delete_fail: 'ลบไม่สำเร็จ',
      toast_kickoff_missing: 'กรุณาระบุเวลาแข่งขัน',
      toast_match_added: 'เพิ่มคู่แข่ง {team1} vs {team2} สำเร็จ!',
      toast_match_add_fail: 'ไม่สามารถเพิ่มคู่แข่งขันได้',
      toast_score_missing: 'กรุณากรอกสกอร์การแข่งขันให้ครบทั้งสองทีม',
      toast_score_saved: 'บันทึกสกอร์และจบการแข่งขันสำเร็จ!',
      toast_score_fail: 'บันทึกสกอร์ล้มเหลว',
      toast_match_reset: 'ยกเลิกผลการแข่งขันและรีเซ็ตสถานะสำเร็จ',
      toast_match_reset_fail: 'รีเซ็ตไม่สำเร็จ',
      toast_reset_success: 'รีเซ็ตระบบและดึงข้อมูลแข่งขันจริงสำเร็จ!',
      toast_reset_fail: 'ไม่สามารถรีเซ็ตระบบได้',
      toast_pin_changed: 'เปลี่ยน PIN ของ {name} สำเร็จ',
      toast_pin_change_fail: 'เปลี่ยน PIN ไม่สำเร็จ',
      toast_connection_error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
      confirm_reset: '⚠️ คำเตือน: คุณต้องการล้างข้อมูลผู้เล่น คะแนน และผลการทายทั้งหมดในระบบใช่หรือไม่? (บัญชีผู้ดูแลระบบ (Admin) จะไม่ถูกลบ)',
      confirm_delete_player: 'คุณแน่ใจหรือไม่ที่จะลบผู้เล่น "{name}"?\nการลบจะลบผลทายทั้งหมดของผู้เล่นนี้ด้วยและไม่สามารถกู้คืนได้',
      confirm_reset_match: 'คุณต้องการยกเลิกผลการแข่งขันนี้และให้ผู้เล่นกลับไปทายผลใหม่ได้ (หากยังไม่ถึงเวลาแข่งขัน)?',
      // GA tab names
      ga_predict: 'รายการแข่งขัน & ทายผล',
      ga_leaderboard: 'ตารางคะแนนผู้เล่น',
      ga_admin: 'แอดมิน',
    },
    en: {
      page_title: 'World Cup 2026 Predictor',
      // Header
      logout_title: 'Log out',
      login_btn: 'Log in',
      // Tabs
      tab_predict: 'Predict',
      tab_leaderboard: 'Leaderboard & Live',
      tab_admin: 'Admin Panel',
      // Login modal
      login_modal_title: 'Sign In',
      login_username_label: 'Username',
      login_username_ph: 'e.g. somchai',
      login_pin_label: '4-digit PIN',
      login_submit: 'Log In',
      // Predict tab
      predict_section_title: 'Matches & Predict',
      predict_lock_info: 'Bets close 15 min before kickoff',
      filter_all: 'All',
      filter_open: 'Open',
      filter_locked: 'Locked',
      filter_finished: 'Finished',
      loading: 'Loading...',
      // Match card
      finished_label: 'Finished',
      loading_time: 'Loading...',
      view_all_predictions: 'View all predictions',
      wins: 'Wins',
      draw: 'Draw',
      login_to_predict: 'Log in to make predictions',
      btn_predict: 'Predict',
      btn_cancel: 'Cancel',
      closes_in: 'Closes in:',
      locked_waiting: 'Locked – awaiting kickoff',
      live_label: 'Live',
      no_matches_in_filter: 'No matches in this category',
      loading_matches: 'Loading matches...',
      error_load_matches: 'Could not load match data',
      // Countdown units
      days: 'd', hours: 'h', minutes: 'min', seconds: 's',
      // Leaderboard
      leaderboard_title: 'Player Leaderboard',
      matrix_title: 'Prediction Matrix',
      matrix_badge: 'Correct = +1 pt',
      matrix_desc: "Shows each player's predictions after lock for transparency",
      col_rank: 'Rank',
      col_player: 'Player',
      col_correct: 'Correct / Total',
      col_points: 'Points',
      matrix_player_col: 'Player',
      no_locked_matches: 'No locked or live matches yet',
      matrix_empty_msg: 'Matrix opens once at least 1 match has kicked off',
      loading_leaderboard: 'Loading leaderboard...',
      error_load_leaderboard: 'Could not load leaderboard',
      no_players_leaderboard: 'No players in the system yet',
      legend_team1: 'Left team wins (e.g. MEX)',
      legend_draw_legend: 'Draw',
      legend_team2: 'Right team wins (e.g. AUS)',
      legend_correct: 'Correct (+1 pt)',
      legend_wrong: 'Wrong (0 pts)',
      // Round labels
      round_group_prefix: 'Group',
      round_group_stage: 'Group Stage',
      round_32: 'Round of 32',
      round_16: 'Round of 16',
      round_qf: 'Quarter-final',
      round_sf: 'Semi-final',
      round_third: '3rd Place',
      round_final: 'Final',
      // Round option labels
      round_opt_group: 'Group Stage',
      round_opt_r32: 'Round of 32',
      round_opt_r16: 'Round of 16',
      round_opt_qf: 'Quarter-finals',
      round_opt_sf: 'Semi-finals',
      round_opt_third: 'Third Place',
      round_opt_final: 'Final',
      // Admin static
      admin_players_title: 'Manage Players',
      admin_players_count_suffix: 'players',
      admin_name_ph: 'Display name',
      admin_username_ph: 'Username',
      admin_pin_ph: '4-digit PIN',
      admin_add_btn: 'Add',
      admin_col_name: 'Display Name',
      admin_col_username: 'Username',
      admin_col_pin: 'PIN',
      admin_col_action: 'Actions',
      admin_change_pin_label: 'Change Admin PIN',
      admin_new_pin_ph: 'New 4-digit PIN',
      admin_save: 'Save',
      admin_matches_title: 'Matches & Results',
      admin_add_match_btn: 'Add Match',
      admin_hide_form_btn: 'Hide Form',
      admin_add_match_title: 'Add New Match',
      admin_team1_label: 'Team 1',
      admin_team1_flag_label: 'Team 1 Flag (Emoji)',
      admin_team2_label: 'Team 2',
      admin_team2_flag_label: 'Team 2 Flag (Emoji)',
      admin_group_label: 'Group (e.g. A, B, R16)',
      admin_round_label: 'Round',
      admin_kickoff_label: 'Kickoff Time (Thai Time)',
      admin_cancel: 'Cancel',
      admin_save_match: 'Save Match',
      admin_col_kickoff: 'Kickoff (TH)',
      admin_col_match: 'Match',
      admin_col_score: 'Score',
      admin_col_manage: 'Manage',
      admin_export_title: 'Export & Backup',
      admin_export_desc: 'Download all predictions and match results in your preferred format',
      admin_export_csv_title: 'Export Excel / CSV',
      admin_export_csv_sub: 'Leaderboard + all predictions',
      admin_export_json_title: 'Database Backup (JSON)',
      admin_export_json_sub: 'Backup file for system restore',
      admin_danger_title: 'Danger Zone',
      admin_danger_desc: 'Reset all player data, predictions, and scores. Admin account is kept. Match schedule will be re-synced automatically.',
      admin_reset_btn: 'Reset Predictor Data',
      // Admin dynamic
      admin_loading_players: 'Loading players...',
      admin_no_players: 'No players yet — add one using the form above',
      admin_error_load: 'Could not load data',
      admin_loading_matches: 'Loading matches...',
      admin_no_matches: 'No match data in the system',
      admin_error_load_matches: 'Could not load match data',
      admin_btn_reset_score: 'Reset',
      admin_btn_save_score: 'Save Result',
      admin_btn_delete: 'Delete',
      admin_pin_ph_small: '4 digits',
      // Footer
      footer_tagline: 'Made with ❤️ for friends',
      footer_time: 'Server time:',
      // User roles
      role_admin: 'Admin',
      role_player: 'Player',
      // Toast / confirm
      toast_welcome: 'Welcome, {name}!',
      toast_login_fail: 'Login failed',
      toast_server_error: 'Server connection error',
      toast_logout: 'Logged out',
      toast_login_required: 'Please log in to make predictions',
      toast_predict_success: 'Prediction saved!',
      toast_predict_cancel: 'Prediction cancelled',
      toast_predict_fail: 'Failed to save prediction',
      toast_pin_invalid: 'PIN must be exactly 4 digits',
      toast_player_added: 'Player {name} added!',
      toast_player_add_fail: 'Failed to add player',
      toast_player_deleted: 'Player {name} deleted',
      toast_player_delete_fail: 'Delete failed',
      toast_kickoff_missing: 'Please enter a kickoff time',
      toast_match_added: 'Match {team1} vs {team2} added!',
      toast_match_add_fail: 'Failed to add match',
      toast_score_missing: 'Please enter scores for both teams',
      toast_score_saved: 'Score saved and match finished!',
      toast_score_fail: 'Failed to save score',
      toast_match_reset: 'Match result cancelled and status reset',
      toast_match_reset_fail: 'Reset failed',
      toast_reset_success: 'System reset and match data synced!',
      toast_reset_fail: 'Failed to reset system',
      toast_pin_changed: 'PIN changed for {name}',
      toast_pin_change_fail: 'Failed to change PIN',
      toast_connection_error: 'Connection error',
      confirm_reset: '⚠️ Warning: Reset all players, scores, and predictions? (Admin account will not be deleted)',
      confirm_delete_player: 'Delete player "{name}"?\nThis will also delete all their predictions and cannot be undone.',
      confirm_reset_match: 'Cancel this match result and allow players to re-predict (if kickoff has not passed)?',
      // GA tab names
      ga_predict: 'Matches & Predict',
      ga_leaderboard: 'Leaderboard',
      ga_admin: 'Admin',
    }
  };

  let currentLang = localStorage.getItem('wc_lang') || 'th';

  window.t = function (key, vars) {
    let str = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) ||
              (TRANSLATIONS.th && TRANSLATIONS.th[key]) ||
              key;
    if (vars) {
      Object.keys(vars).forEach(k => { str = str.replace('{' + k + '}', vars[k]); });
    }
    return str;
  };

  window.getCurrentLang = function () { return currentLang; };

  window.setLang = function (lang) {
    currentLang = lang;
    localStorage.setItem('wc_lang', lang);
    applyTranslations();
    updateLangToggle();
    // Re-render dynamic content
    if (typeof window.renderMatches === 'function' && window.matchesData && window.matchesData.length) window.renderMatches();
    if (typeof window.renderLeaderboard === 'function' && window.leaderboardData) window.renderLeaderboard();
    const adminTab = document.getElementById('admin-tab');
    if (adminTab && !adminTab.classList.contains('hidden')) {
      if (typeof window.loadAdminPlayers === 'function') window.loadAdminPlayers();
      if (typeof window.loadAdminMatches === 'function') window.loadAdminMatches();
    }
  };

  function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.title = t('page_title');
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPh);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-opt]').forEach(el => {
      el.textContent = t(el.dataset.i18nOpt);
    });
  }

  function updateLangToggle() {
    const btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = currentLang === 'th' ? 'EN' : 'ไทย';
  }

  window.applyTranslations = applyTranslations;

  document.addEventListener('DOMContentLoaded', function () {
    applyTranslations();
    updateLangToggle();
  });
})();
