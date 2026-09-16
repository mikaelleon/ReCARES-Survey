/* @ds-bundle: {"format":4,"namespace":"CamellaHomesSurveyDesignSystem_9824d8","components":[{"name":"FaqList","sourcePath":"components/content/FaqList.jsx"},{"name":"GoalCard","sourcePath":"components/content/GoalCard.jsx"},{"name":"InfoCard","sourcePath":"components/content/InfoCard.jsx"},{"name":"StatRow","sourcePath":"components/content/StatRow.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"LikertScale","sourcePath":"components/forms/LikertScale.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Card","sourcePath":"components/layout/Card.jsx"},{"name":"Footer","sourcePath":"components/layout/Footer.jsx"},{"name":"LanguageToggle","sourcePath":"components/navigation/LanguageToggle.jsx"},{"name":"NavBar","sourcePath":"components/navigation/NavBar.jsx"}],"sourceHashes":{"components/content/FaqList.jsx":"d4c73879f8a4","components/content/GoalCard.jsx":"f077ff63276a","components/content/InfoCard.jsx":"f9c46693cac6","components/content/StatRow.jsx":"a109522f8bee","components/feedback/Modal.jsx":"85d56ec88724","components/feedback/ProgressBar.jsx":"2f588388e136","components/forms/Button.jsx":"70666df468f8","components/forms/Checkbox.jsx":"9c84c233aa85","components/forms/Input.jsx":"ba5a6980c22c","components/forms/LikertScale.jsx":"1307d5a60f51","components/forms/Select.jsx":"dfe36891e425","components/layout/Card.jsx":"65115cafa77c","components/layout/Footer.jsx":"7539dbcf917a","components/navigation/LanguageToggle.jsx":"5ecc0cbb8728","components/navigation/NavBar.jsx":"6f75b186a7ee","ui_kits/recares-homepage/FaqSection.jsx":"1f15c44d0bd9","ui_kits/recares-homepage/GoalsSection.jsx":"198f7ae4a47f","ui_kits/recares-homepage/Hero.jsx":"e1f3e661839f","ui_kits/recares-homepage/IconSlot.jsx":"c1e58b7158b4","ui_kits/recares-homepage/InquirySection.jsx":"d95211fd4e86","ui_kits/survey-website/ConfirmationScreen.jsx":"c0862c698013","ui_kits/survey-website/IntroModal.jsx":"004c5bf86839","ui_kits/survey-website/LandingScreen.jsx":"aa438db96c3a","ui_kits/survey-website/SurveyScreen.jsx":"e66a7f4902d5"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CamellaHomesSurveyDesignSystem_9824d8 = window.CamellaHomesSurveyDesignSystem_9824d8 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/content/FaqList.jsx
try { (() => {
const {
  useState
} = React;
function FaqList({
  items = [],
  defaultOpen = 0
}) {
  const [open, setOpen] = useState(defaultOpen);
  return React.createElement('div', {
    style: {
      background: 'var(--card-fill-neutral)',
      borderRadius: 'var(--radius-card)',
      padding: 8,
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, items.map((it, i) => {
    const isOpen = open === i;
    return React.createElement('div', {
      key: i,
      style: {
        background: isOpen ? 'var(--card-fill-accordion-open)' : 'transparent',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        transition: 'background var(--motion-duration) var(--motion-ease)'
      }
    }, React.createElement('button', {
      onClick: () => setOpen(isOpen ? -1 : i),
      'aria-expanded': isOpen,
      style: {
        width: '100%',
        minHeight: 'var(--touch-target-min)',
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '12px 16px',
        fontFamily: 'var(--font-sans)',
        color: 'var(--text-on-card-neutral)',
        textTransform: 'uppercase',
        fontSize: 'var(--text-card-title-size)',
        fontWeight: 'var(--text-card-title-weight)',
        letterSpacing: 'var(--text-card-title-tracking)'
      }
    }, React.createElement('span', null, it.question), React.createElement('span', {
      'aria-hidden': 'true',
      style: {
        flexShrink: 0,
        color: 'var(--accent-selected)',
        fontSize: 18,
        lineHeight: 1
      }
    }, isOpen ? '−' : '+')), isOpen && React.createElement('div', {
      style: {
        padding: '0 16px 16px',
        color: 'var(--text-on-card-neutral)',
        fontSize: 'var(--text-body-size)',
        fontWeight: 'var(--weight-body)',
        lineHeight: 'var(--text-body-line)'
      }
    }, it.answer));
  }));
}
Object.assign(__ds_scope, { FaqList });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/FaqList.jsx", error: String((e && e.message) || e) }); }

// components/content/GoalCard.jsx
try { (() => {
function GoalCard({
  title,
  children
}) {
  return React.createElement('div', {
    style: {
      flex: '1 1 0',
      minWidth: 0,
      background: 'var(--card-fill-brand)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--card-padding)',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-on-card-brand)'
    }
  }, React.createElement('h3', {
    style: {
      margin: '0 0 12px',
      color: 'var(--white)',
      textTransform: 'uppercase',
      fontSize: 'var(--text-card-title-size)',
      fontWeight: 'var(--text-card-title-weight)',
      letterSpacing: 'var(--text-card-title-tracking)',
      lineHeight: 1.35
    }
  }, title), React.createElement('div', {
    style: {
      color: 'var(--white)',
      fontSize: 'var(--text-body-size)',
      fontWeight: 'var(--weight-body)',
      lineHeight: 'var(--text-body-line)'
    }
  }, children));
}
Object.assign(__ds_scope, { GoalCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/GoalCard.jsx", error: String((e && e.message) || e) }); }

// components/content/InfoCard.jsx
try { (() => {
function InfoCard({
  heading,
  children,
  iconSide = 'right',
  icon = null
}) {
  const card = React.createElement('div', {
    key: 'card',
    style: {
      flex: '1 1 0',
      minWidth: 0,
      background: 'var(--card-fill-neutral)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--card-padding)',
      fontFamily: 'var(--font-sans)'
    }
  }, heading && React.createElement('h2', {
    style: {
      margin: '0 0 16px',
      color: 'var(--text-section-heading)',
      textTransform: 'uppercase',
      fontSize: 'var(--text-section-heading-size)',
      fontWeight: 'var(--text-section-heading-weight)',
      letterSpacing: 'var(--text-section-heading-tracking)',
      lineHeight: 1.25
    }
  }, heading), React.createElement('div', {
    style: {
      color: 'var(--text-on-card-neutral)',
      fontSize: 'var(--text-body-size)',
      fontWeight: 'var(--weight-body)',
      lineHeight: 'var(--text-body-line)'
    }
  }, children));
  // Icon slot is intentionally transparent — never a hardcoded light fill (v3 icon rule).
  const iconSlot = React.createElement('div', {
    key: 'icon',
    style: {
      flex: '0 0 200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent'
    }
  }, icon);
  return React.createElement('div', {
    style: {
      display: 'flex',
      gap: 32,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, iconSide === 'left' ? [iconSlot, card] : [card, iconSlot]);
}
Object.assign(__ds_scope, { InfoCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/InfoCard.jsx", error: String((e && e.message) || e) }); }

// components/content/StatRow.jsx
try { (() => {
// Dot colors are decorative sequence only — never status coding (v3 stat-row rule).
function StatRow({
  label,
  description,
  dotColor = 'var(--harvest-orange)'
}) {
  return React.createElement('div', {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      fontFamily: 'var(--font-sans)',
      minHeight: 'var(--touch-target-min)'
    }
  }, React.createElement('span', {
    'aria-hidden': 'true',
    style: {
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: dotColor,
      flexShrink: 0,
      marginTop: 4
    }
  }), React.createElement('div', {
    style: {
      minWidth: 0
    }
  }, React.createElement('div', {
    style: {
      color: 'var(--text-body)',
      textTransform: 'uppercase',
      fontSize: 'var(--text-card-title-size)',
      fontWeight: 'var(--text-card-title-weight)',
      letterSpacing: 'var(--text-card-title-tracking)'
    }
  }, label), React.createElement('div', {
    style: {
      color: 'var(--text-caption)',
      fontSize: 'var(--text-caption-size)',
      fontWeight: 'var(--weight-body)',
      lineHeight: 'var(--text-caption-line)',
      marginTop: 4
    }
  }, description)));
}
Object.assign(__ds_scope, { StatRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/StatRow.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
function Modal({
  open = true,
  onClose,
  children
}) {
  if (!open) return null;
  return React.createElement('div', {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'var(--overlay-backdrop)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    },
    onClick: onClose
  }, React.createElement('div', {
    onClick: e => e.stopPropagation(),
    style: {
      background: 'var(--surface-3)',
      border: '1px solid var(--surface-3-border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-modal)',
      padding: 32,
      maxWidth: 420,
      width: '90%',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-body)'
    }
  }, children));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
function ProgressBar({
  value = 0,
  max = 100
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  return React.createElement('div', {
    style: {
      width: '100%',
      height: 8,
      background: 'var(--surface-1)',
      borderRadius: 999,
      overflow: 'hidden'
    }
  }, React.createElement('div', {
    style: {
      width: pct + '%',
      height: '100%',
      background: 'var(--accent-primary)',
      transition: 'width var(--motion-duration) var(--motion-ease)'
    }
  }));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
const {
  useState
} = React;
function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon = null,
  onDark = false,
  children,
  onClick
}) {
  const [hover, setHover] = useState(false);
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const height = size === 'sm' ? 40 : 44;
  const base = {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-button-size)',
    fontWeight: 'var(--text-button-weight)',
    letterSpacing: 'var(--text-button-tracking)',
    textTransform: 'uppercase',
    height,
    minWidth: height,
    padding: '0 20px',
    borderRadius: 'var(--radius-sm)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    transition: 'background var(--motion-duration) var(--motion-ease), opacity var(--motion-duration) var(--motion-ease)',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap'
  };
  const onDarkText = onDark ? 'var(--white)' : 'var(--text-body)';
  const onDarkBorder = onDark ? 'rgba(255,255,255,.7)' : 'var(--border-default)';
  // On a --card-fill-brand (Emerald) surface, an Emerald primary fill would vanish.
  // onDark swaps the primary fill to Bright Amber with dark text; hover still moves to Orange.
  const primaryFill = onDark ? hover && !disabled ? 'var(--accent-hover)' : 'var(--accent-selected)' : hover && !disabled ? 'var(--accent-hover)' : 'var(--accent-primary)';
  const primaryText = onDark || hover && !disabled ? 'var(--text-on-accent)' : 'var(--text-on-primary)';
  const style = isPrimary ? {
    ...base,
    background: primaryFill,
    color: primaryText
  } : isSecondary ? {
    ...base,
    background: 'transparent',
    color: onDarkText,
    border: '1px solid ' + onDarkBorder
  } : {
    ...base,
    background: 'transparent',
    color: 'var(--bright-amber)',
    border: 'none',
    padding: '0 8px'
  };
  return React.createElement('button', {
    style,
    onClick,
    disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  label,
  checked = false,
  onChange
}) {
  return React.createElement('label', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      minHeight: 'var(--touch-target-min)'
    }
  }, React.createElement('span', {
    style: {
      width: 24,
      height: 24,
      borderRadius: 'var(--radius-checkbox)',
      flexShrink: 0,
      background: checked ? 'var(--bright-amber)' : 'var(--surface-1)',
      border: checked ? 'none' : '1px solid var(--border-default)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background var(--motion-duration) var(--motion-ease)'
    }
  }, checked && React.createElement('span', {
    style: {
      color: 'var(--text-on-accent)',
      fontSize: 15,
      fontWeight: 700,
      lineHeight: 1
    }
  }, '✓')), React.createElement('input', {
    type: 'checkbox',
    checked,
    onChange,
    style: {
      display: 'none'
    }
  }), React.createElement('span', {
    style: {
      color: 'var(--text-body)',
      fontSize: 'var(--text-body-size)'
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  required = false,
  error = null,
  helperText = null
}) {
  return React.createElement('div', {
    style: {
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      width: '100%'
    }
  }, label && React.createElement('label', {
    style: {
      fontSize: 'var(--text-label-size)',
      fontWeight: 'var(--text-label-weight)',
      color: 'var(--text-body)',
      display: 'flex',
      gap: 4
    }
  }, label, required && React.createElement('span', {
    style: {
      color: 'var(--harvest-orange)'
    },
    'aria-label': 'required'
  }, '*')), React.createElement('input', {
    type,
    placeholder,
    value,
    onChange,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-size)',
      color: 'var(--text-body)',
      background: 'var(--surface-2)',
      border: error ? '1px solid var(--error-red)' : '1px solid transparent',
      borderRadius: 'var(--radius-sm)',
      height: 44,
      padding: '0 14px',
      outline: 'none',
      boxSizing: 'border-box'
    }
  }), error ? React.createElement('span', {
    style: {
      fontSize: 'var(--text-caption-size)',
      color: 'var(--error-red)'
    }
  }, error) : helperText && React.createElement('span', {
    style: {
      fontSize: 'var(--text-caption-size)',
      color: 'var(--text-caption)'
    }
  }, helperText));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/LikertScale.jsx
try { (() => {
function LikertScale({
  question,
  value,
  onChange,
  labels = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree']
}) {
  return React.createElement('div', {
    style: {
      fontFamily: 'var(--font-sans)',
      width: '100%'
    }
  }, question && React.createElement('div', {
    style: {
      color: 'var(--text-body)',
      fontSize: 'var(--text-body-size)',
      marginBottom: 16
    }
  }, question), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 8,
      justifyContent: 'space-between'
    }
  }, [1, 2, 3, 4, 5].map(n => React.createElement('button', {
    key: n,
    onClick: () => onChange && onChange(n),
    'aria-label': labels[n - 1],
    style: {
      flex: 1,
      height: 44,
      borderRadius: 'var(--radius-sm)',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      fontWeight: 600,
      fontSize: 14,
      background: value === n ? 'var(--bright-amber)' : 'var(--surface-1)',
      color: value === n ? 'var(--text-on-accent)' : 'var(--text-body)',
      border: value === n ? 'none' : '1px solid var(--border-default)',
      transition: 'background var(--motion-duration) var(--motion-ease)'
    }
  }, n))), React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 6,
      fontSize: 'var(--text-caption-size)',
      color: 'var(--text-caption)'
    }
  }, React.createElement('span', null, labels[0]), React.createElement('span', null, labels[4])));
}
Object.assign(__ds_scope, { LikertScale });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/LikertScale.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select…',
  required = false
}) {
  return React.createElement('div', {
    style: {
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      width: '100%'
    }
  }, label && React.createElement('label', {
    style: {
      fontSize: 'var(--text-label-size)',
      fontWeight: 'var(--text-label-weight)',
      color: 'var(--text-body)',
      display: 'flex',
      gap: 4
    }
  }, label, required && React.createElement('span', {
    style: {
      color: 'var(--harvest-orange)'
    }
  }, '*')), React.createElement('select', {
    value,
    onChange,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-size)',
      color: value ? 'var(--text-body)' : 'var(--text-caption)',
      background: 'var(--surface-2)',
      border: '1px solid transparent',
      borderRadius: 'var(--radius-sm)',
      height: 44,
      padding: '0 14px',
      outline: 'none',
      boxSizing: 'border-box',
      width: '100%',
      appearance: 'none'
    }
  }, React.createElement('option', {
    value: '',
    disabled: true,
    hidden: true
  }, placeholder), options.map((o, i) => React.createElement('option', {
    key: i,
    value: o
  }, o))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/layout/Card.jsx
try { (() => {
function Card({
  children,
  padding = 24
}) {
  return React.createElement('div', {
    style: {
      background: 'var(--surface-1)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-card)',
      padding,
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-body)'
    }
  }, children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Card.jsx", error: String((e && e.message) || e) }); }

// components/layout/Footer.jsx
try { (() => {
// Carries capstone attribution plus the relocated Sign Up / Login links (v3 footer correction).
function Footer({
  credit,
  university,
  hoa,
  adminLinks = ['Sign Up', 'Login'],
  onAdminLink
}) {
  return React.createElement('footer', {
    style: {
      background: 'var(--dark-emerald)',
      width: '100%',
      padding: '32px',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      gap: 24,
      flexWrap: 'wrap',
      justifyContent: 'space-between'
    }
  }, React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 0
    }
  }, credit && React.createElement('div', {
    style: {
      color: 'var(--white)',
      fontSize: 'var(--text-label-size)',
      fontWeight: 'var(--weight-bold)'
    }
  }, credit), university && React.createElement('div', {
    style: {
      color: 'rgba(255,255,255,.75)',
      fontSize: 'var(--text-caption-size)',
      fontWeight: 'var(--weight-body)'
    }
  }, university), hoa && React.createElement('div', {
    style: {
      color: 'rgba(255,255,255,.75)',
      fontSize: 'var(--text-caption-size)',
      fontWeight: 'var(--weight-body)'
    }
  }, hoa)), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 16,
      alignItems: 'flex-start'
    }
  }, adminLinks.map(l => React.createElement('button', {
    key: l,
    onClick: () => onAdminLink && onAdminLink(l),
    style: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-caption-size)',
      fontWeight: 'var(--weight-body)',
      color: 'rgba(255,255,255,.75)',
      textDecoration: 'underline'
    }
  }, l))));
}
Object.assign(__ds_scope, { Footer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/layout/Footer.jsx", error: String((e && e.message) || e) }); }

// components/navigation/LanguageToggle.jsx
try { (() => {
function LanguageToggle({
  value = 'EN',
  onChange
}) {
  const opts = ['EN', 'FIL'];
  return React.createElement('div', {
    style: {
      display: 'inline-flex',
      gap: 8,
      fontFamily: 'var(--font-sans)'
    }
  }, opts.map(o => React.createElement('button', {
    key: o,
    onClick: () => onChange && onChange(o),
    style: {
      height: 40,
      padding: '0 20px',
      borderRadius: 999,
      border: 'none',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: 14,
      background: value === o ? 'var(--bright-amber)' : 'var(--surface-1)',
      color: value === o ? 'var(--text-on-accent)' : 'var(--text-body)',
      transition: 'background var(--motion-duration) var(--motion-ease)'
    }
  }, o)));
}
Object.assign(__ds_scope, { LanguageToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/LanguageToggle.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavBar.jsx
try { (() => {
// Resident-facing links only. Sign Up / Login deliberately live in the Footer (v3 nav correction).
function NavBar({
  brand = 'ReCARES',
  links = ['Home', 'About', 'FAQ'],
  active = 'Home',
  onNavigate
}) {
  return React.createElement('nav', {
    style: {
      background: 'var(--dark-emerald)',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 24,
      padding: '0 32px',
      minHeight: 64,
      fontFamily: 'var(--font-sans)',
      boxSizing: 'border-box'
    }
  }, React.createElement('span', {
    style: {
      color: 'var(--white)',
      fontSize: 20,
      fontWeight: 'var(--weight-bold)',
      letterSpacing: '.04em'
    }
  }, brand), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 8
    }
  }, links.map(l => React.createElement('button', {
    key: l,
    onClick: () => onNavigate && onNavigate(l),
    style: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      minHeight: 'var(--touch-target-min)',
      padding: '0 14px',
      textTransform: 'uppercase',
      fontSize: 'var(--text-button-size)',
      fontWeight: 'var(--text-button-weight)',
      letterSpacing: 'var(--text-button-tracking)',
      color: active === l ? 'var(--bright-amber)' : 'var(--white)',
      borderBottom: active === l ? '2px solid var(--bright-amber)' : '2px solid transparent'
    }
  }, l))));
}
Object.assign(__ds_scope, { NavBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/recares-homepage/FaqSection.jsx
try { (() => {
function FaqSection({
  onStart
}) {
  const {
    FaqList,
    StatRow,
    Button
  } = window.CamellaHomesSurveyDesignSystem_9824d8;
  return React.createElement('section', {
    style: {
      maxWidth: 'var(--content-max-width)',
      margin: '0 auto',
      padding: '0 32px',
      display: 'flex',
      gap: 32,
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      fontFamily: 'var(--font-sans)'
    }
  }, React.createElement('div', {
    style: {
      flex: '2 1 380px',
      minWidth: 0
    }
  }, React.createElement('h2', {
    style: {
      margin: '0 0 24px',
      color: 'var(--text-section-heading)',
      textTransform: 'uppercase',
      fontSize: 'var(--text-section-heading-size)',
      fontWeight: 'var(--text-section-heading-weight)',
      letterSpacing: 'var(--text-section-heading-tracking)'
    }
  }, 'Frequently asked'), React.createElement(FaqList, {
    items: [{
      question: 'Who is running this survey?',
      answer: 'A student capstone research team working together with the Camella Homes Tibig Homeowners Association.'
    }, {
      question: 'Is my response anonymous?',
      answer: 'Results are reported in aggregate. Individual answers are never published or shared with neighbours.'
    }, {
      question: 'Who should answer it?',
      answer: 'Any resident of the subdivision — both homeowners and tenants have their own track.'
    }, {
      question: 'What happens to the results?',
      answer: 'They are summarised for the association and form the basis of the capstone study.'
    }]
  })), React.createElement('aside', {
    style: {
      flex: '1 1 260px',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, React.createElement(StatRow, {
    label: '5 minutes',
    description: 'Average time to complete the survey.',
    dotColor: 'var(--harvest-orange)'
  }), React.createElement(StatRow, {
    label: 'Confidential',
    description: 'Answers are reported in aggregate only.',
    dotColor: 'var(--bright-amber)'
  }), React.createElement(StatRow, {
    label: 'Two tracks',
    description: 'Separate paths for homeowners and tenants.',
    dotColor: 'var(--dark-emerald)'
  }), React.createElement(Button, {
    variant: 'primary',
    onClick: onStart
  }, 'Start the survey')));
}
window.FaqSection = FaqSection;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/recares-homepage/FaqSection.jsx", error: String((e && e.message) || e) }); }

// ui_kits/recares-homepage/GoalsSection.jsx
try { (() => {
function GoalsSection() {
  const {
    GoalCard
  } = window.CamellaHomesSurveyDesignSystem_9824d8;
  const goals = [['Identify resident needs', 'Gather first-hand data on what households in Tibig actually require from the association.'], ['Map accessibility gaps', 'Locate the places where elderly and PWD residents are blocked from moving safely.'], ['Guide HOA decisions', 'Give the association evidence it can act on instead of anecdote.']];
  return React.createElement('section', {
    style: {
      maxWidth: 'var(--content-max-width)',
      margin: '0 auto',
      padding: '0 32px',
      fontFamily: 'var(--font-sans)'
    }
  }, React.createElement('h2', {
    style: {
      margin: '0 0 24px',
      color: 'var(--text-section-heading)',
      textTransform: 'uppercase',
      fontSize: 'var(--text-section-heading-size)',
      fontWeight: 'var(--text-section-heading-weight)',
      letterSpacing: 'var(--text-section-heading-tracking)'
    }
  }, 'Goals of this study'), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 24,
      flexWrap: 'wrap'
    }
  }, goals.map(([t, b]) => React.createElement(GoalCard, {
    key: t,
    title: t
  }, b))));
}
window.GoalsSection = GoalsSection;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/recares-homepage/GoalsSection.jsx", error: String((e && e.message) || e) }); }

// ui_kits/recares-homepage/Hero.jsx
try { (() => {
// Hero — four-color stripe accent, photo background placeholder, wordmark, two CTAs.
// NOTE: no hero photograph was supplied. The photo layer is a labeled placeholder, not invented artwork.
function Hero({
  onStart
}) {
  const {
    Button
  } = window.CamellaHomesSurveyDesignSystem_9824d8;
  return React.createElement('section', {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--emerald-900)'
    }
  },
  // photo placeholder + dark overlay
  React.createElement('div', {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'var(--overlay-hero)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      padding: 8
    }
  }, React.createElement('span', {
    style: {
      color: 'rgba(255,255,255,.5)',
      fontSize: 11,
      fontFamily: 'var(--font-sans)'
    }
  }, 'photo placeholder — subdivision perimeter fence (asset not supplied)')),
  // four-color stripe accent — a narrow band, sits above the overlay so it stays true to palette
  React.createElement('div', {
    'aria-hidden': 'true',
    style: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 8,
      display: 'flex'
    }
  }, ['#0F5A35', '#2A9A63', 'var(--harvest-orange)', 'var(--bright-amber)'].map((c, i) => React.createElement('div', {
    key: i,
    style: {
      flex: 1,
      background: c
    }
  }))), React.createElement('div', {
    style: {
      position: 'relative',
      maxWidth: 'var(--content-max-width)',
      margin: '0 auto',
      padding: '80px 32px',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      alignItems: 'flex-start'
    }
  }, React.createElement('div', {
    style: {
      fontSize: 52,
      fontWeight: 'var(--weight-bold)',
      letterSpacing: '.02em',
      lineHeight: 1
    }
  }, [['Re', 'var(--bright-amber)'], ['C', 'var(--white)'], ['A', 'var(--harvest-orange)'], ['R', 'var(--white)'], ['E', 'var(--bright-amber)'], ['S', 'var(--white)']].map(([ch, col], i) => React.createElement('span', {
    key: i,
    style: {
      color: col
    }
  }, ch))), React.createElement('h1', {
    style: {
      margin: 0,
      color: 'var(--white)',
      fontSize: 'var(--text-h1-size)',
      fontWeight: 'var(--text-h1-weight)',
      lineHeight: 'var(--text-h1-line)'
    }
  }, 'Community Needs Assessment Survey'), React.createElement('div', {
    style: {
      color: 'var(--bright-amber)',
      textTransform: 'uppercase',
      fontSize: 'var(--text-eyebrow-size)',
      fontWeight: 'var(--text-eyebrow-weight)',
      letterSpacing: 'var(--text-eyebrow-tracking)'
    }
  }, 'For residents of Camella Homes Tibig, Lipa City'), React.createElement('p', {
    style: {
      margin: 0,
      maxWidth: 560,
      color: 'var(--white)',
      fontSize: 'var(--text-body-size)',
      fontWeight: 'var(--weight-body)',
      lineHeight: 'var(--text-body-line)'
    }
  }, 'Tell us what your household needs so the homeowners association can act on real evidence.'), React.createElement('div', {
    style: {
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      marginTop: 8
    }
  }, React.createElement(Button, {
    variant: 'primary',
    onDark: true,
    onClick: onStart
  }, 'Start the survey'), React.createElement(Button, {
    variant: 'secondary',
    onDark: true
  }, 'Learn more'))));
}
window.Hero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/recares-homepage/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/recares-homepage/IconSlot.jsx
try { (() => {
// Icon slot stub — no icon artwork was supplied, and v3 flags the About Us icon concept as unresolved.
// Background is transparent by rule; never a hardcoded light fill.
function IconSlot({
  note
}) {
  return React.createElement('div', {
    style: {
      width: '100%',
      aspectRatio: '1',
      background: 'transparent',
      border: '1px dashed var(--border-structural)',
      borderRadius: 'var(--radius-card)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 16,
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)',
      color: 'var(--text-caption)',
      fontSize: 12,
      lineHeight: 1.4
    }
  }, note);
}
window.IconSlot = IconSlot;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/recares-homepage/IconSlot.jsx", error: String((e && e.message) || e) }); }

// ui_kits/recares-homepage/InquirySection.jsx
try { (() => {
// Inquiry form card — Emerald fill, matching the goal cards rather than the neutral info cards.
function InquirySection() {
  const {
    Button
  } = window.CamellaHomesSurveyDesignSystem_9824d8;
  const [sent, setSent] = React.useState(false);
  const field = (label, optional, multiline) => React.createElement('label', {
    key: label,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }
  }, React.createElement('span', {
    style: {
      color: 'var(--white)',
      textTransform: 'uppercase',
      fontSize: 'var(--text-card-title-size)',
      fontWeight: 'var(--text-card-title-weight)',
      letterSpacing: 'var(--text-card-title-tracking)'
    }
  }, optional ? label + ' (optional)' : label), React.createElement(multiline ? 'textarea' : 'input', {
    rows: multiline ? 4 : undefined,
    style: {
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-size)',
      color: 'var(--black)',
      background: 'var(--white)',
      border: '1px solid var(--border-structural)',
      borderRadius: 'var(--radius-sm)',
      padding: '12px 14px',
      minHeight: 44,
      resize: 'vertical',
      boxSizing: 'border-box'
    }
  }));
  return React.createElement('section', {
    style: {
      maxWidth: 'var(--content-max-width)',
      margin: '0 auto',
      padding: '0 32px',
      fontFamily: 'var(--font-sans)'
    }
  }, React.createElement('div', {
    style: {
      background: 'var(--card-fill-brand)',
      borderRadius: 'var(--radius-card)',
      padding: 'var(--card-padding)',
      maxWidth: 'var(--content-max-width-form)',
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, React.createElement('h2', {
    style: {
      margin: 0,
      color: 'var(--white)',
      textTransform: 'uppercase',
      fontSize: 'var(--text-section-heading-size)',
      fontWeight: 'var(--text-section-heading-weight)',
      letterSpacing: 'var(--text-section-heading-tracking)'
    }
  }, 'Have a question?'), React.createElement('p', {
    style: {
      margin: 0,
      color: 'var(--white)',
      fontSize: 'var(--text-body-size)',
      fontWeight: 'var(--weight-body)',
      lineHeight: 'var(--text-body-line)'
    }
  }, 'Send the research team a message and we will reply through the association.'), field('Name', true, false), field('Email', false, false), field('Message', false, true), React.createElement('div', null, React.createElement(Button, {
    variant: 'primary',
    onDark: true,
    onClick: () => setSent(true)
  }, sent ? 'Message sent' : 'Send message'))));
}
window.InquirySection = InquirySection;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/recares-homepage/InquirySection.jsx", error: String((e && e.message) || e) }); }

// ui_kits/survey-website/ConfirmationScreen.jsx
try { (() => {
function ConfirmationScreen({
  onRestart
}) {
  const {
    Button,
    Card
  } = window.CamellaHomesSurveyDesignSystem_9824d8;
  const Screen = window.SurveyScreenHelper;
  return React.createElement(Screen, null, React.createElement(Card, {
    padding: 32
  }, React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12
    }
  }, React.createElement('span', {
    style: {
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: 'var(--bright-amber)',
      color: 'var(--text-on-accent)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 700
    }
  }, '✓'), React.createElement('h2', {
    style: {
      color: 'var(--text-headline)',
      fontSize: 'var(--text-h2-size)',
      fontWeight: 'var(--text-h2-weight)',
      margin: 0
    }
  }, 'Salamat! Thank you.')), React.createElement('p', {
    style: {
      color: 'var(--text-caption)',
      fontSize: 'var(--text-body-size)',
      lineHeight: 'var(--text-body-line)'
    }
  }, 'Your responses have been recorded. Camella Homes Tibig appreciates your time.')), React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'center'
    }
  }, React.createElement(Button, {
    variant: 'ghost',
    onClick: onRestart
  }, 'Restart demo')));
}
window.ConfirmationScreen = ConfirmationScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/survey-website/ConfirmationScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/survey-website/IntroModal.jsx
try { (() => {
function IntroModal({
  open,
  lang,
  setLang,
  onAgree
}) {
  const {
    Modal,
    LanguageToggle,
    Button,
    Checkbox
  } = window.CamellaHomesSurveyDesignSystem_9824d8;
  const [agree, setAgree] = React.useState(false);
  const copy = lang === 'EN' ? {
    title: 'Before we start',
    body: 'Your responses are confidential and used only to improve Camella Homes Tibig. Choose your preferred language.',
    consent: 'I agree to the privacy notice.',
    cta: 'Continue'
  } : {
    title: 'Bago magsimula',
    body: 'Kompidensyal ang iyong mga sagot at gagamitin lamang para mapabuti ang Camella Homes Tibig. Piliin ang gusto mong wika.',
    consent: 'Sumasang-ayon ako sa patakaran sa privacy.',
    cta: 'Magpatuloy'
  };
  return React.createElement(Modal, {
    open,
    onClose: () => {}
  }, React.createElement('h2', {
    style: {
      fontSize: 'var(--text-h2-size)',
      fontWeight: 'var(--text-h2-weight)',
      color: 'var(--text-headline)',
      margin: '0 0 12px'
    }
  }, copy.title), React.createElement('p', {
    style: {
      color: 'var(--text-body)',
      fontSize: 'var(--text-body-size)',
      lineHeight: 'var(--text-body-line)',
      margin: '0 0 20px'
    }
  }, copy.body), React.createElement(LanguageToggle, {
    value: lang,
    onChange: setLang
  }), React.createElement('div', {
    style: {
      margin: '20px 0'
    }
  }, React.createElement(Checkbox, {
    label: copy.consent,
    checked: agree,
    onChange: () => setAgree(!agree)
  })), React.createElement(Button, {
    variant: 'primary',
    disabled: !agree,
    onClick: onAgree
  }, copy.cta));
}
window.IntroModal = IntroModal;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/survey-website/IntroModal.jsx", error: String((e && e.message) || e) }); }

// ui_kits/survey-website/LandingScreen.jsx
try { (() => {
function Screen({
  children
}) {
  return React.createElement('div', {
    style: {
      minHeight: '100%',
      background: 'var(--bg-page)',
      display: 'flex',
      justifyContent: 'center',
      padding: '48px 20px',
      boxSizing: 'border-box',
      fontFamily: 'var(--font-sans)'
    }
  }, React.createElement('div', {
    style: {
      maxWidth: 'var(--content-max-width)',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 32
    }
  }, children));
}
function LandingScreen({
  onStart
}) {
  const {
    Button
  } = window.CamellaHomesSurveyDesignSystem_9824d8;
  return React.createElement(Screen, null, React.createElement('div', {
    style: {
      textAlign: 'center',
      marginTop: 40
    }
  }, React.createElement('div', {
    style: {
      color: 'var(--bright-amber)',
      fontSize: 'var(--text-label-size)',
      fontWeight: 600,
      letterSpacing: 1,
      marginBottom: 12
    }
  }, 'CAMELLA HOMES TIBIG'), React.createElement('h1', {
    style: {
      color: 'var(--text-headline)',
      fontSize: 'var(--text-h1-size)',
      fontWeight: 'var(--text-h1-weight)',
      lineHeight: 'var(--text-h1-line)',
      margin: 0
    }
  }, 'Resident Experience Survey'), React.createElement('p', {
    style: {
      color: 'var(--text-caption)',
      fontSize: 'var(--text-body-size)',
      lineHeight: 'var(--text-body-line)',
      marginTop: 16
    }
  }, 'Help us improve your community. This survey takes about 5 minutes and covers your experience as a homeowner or tenant.')), React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'center'
    }
  }, React.createElement(Button, {
    variant: 'primary',
    onClick: onStart
  }, 'Start survey')));
}
window.LandingScreen = LandingScreen;
window.SurveyScreenHelper = Screen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/survey-website/LandingScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/survey-website/SurveyScreen.jsx
try { (() => {
function SurveyScreen({
  step,
  total,
  onBack,
  onNext,
  answers,
  setAnswer
}) {
  const {
    Card,
    LikertScale,
    Checkbox,
    Select,
    Button,
    ProgressBar
  } = window.CamellaHomesSurveyDesignSystem_9824d8;
  const Screen = window.SurveyScreenHelper;
  const amenities = ['Clubhouse', 'Swimming pool', 'Basketball court', 'Playground'];
  return React.createElement(Screen, null, React.createElement(ProgressBar, {
    value: step,
    max: total
  }), React.createElement('h2', {
    style: {
      color: 'var(--text-headline)',
      fontSize: 'var(--text-h2-size)',
      fontWeight: 'var(--text-h2-weight)',
      margin: 0
    }
  }, 'Homeowner path — Section 2 of 4'), React.createElement(Card, null, React.createElement(LikertScale, {
    question: 'I feel safe walking in the subdivision at night.',
    value: answers.safety,
    onChange: v => setAnswer('safety', v)
  })), React.createElement(Card, null, React.createElement('h3', {
    style: {
      color: 'var(--text-headline)',
      fontSize: 'var(--text-h3-size)',
      fontWeight: 'var(--text-h3-weight)',
      margin: '0 0 16px'
    }
  }, 'Which amenities have you used in the past year?'), React.createElement('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, amenities.map(a => React.createElement(Checkbox, {
    key: a,
    label: a,
    checked: !!answers.amenities?.[a],
    onChange: () => setAnswer('amenities', {
      ...answers.amenities,
      [a]: !answers.amenities?.[a]
    })
  })))), React.createElement(Card, null, React.createElement(Select, {
    label: 'How long have you lived here?',
    required: true,
    options: ['Less than 1 year', '1-3 years', '3-5 years', '5+ years'],
    value: answers.tenure,
    onChange: e => setAnswer('tenure', e.target.value)
  })), React.createElement('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between'
    }
  }, React.createElement(Button, {
    variant: 'secondary',
    onClick: onBack
  }, 'Back'), React.createElement(Button, {
    variant: 'primary',
    onClick: onNext
  }, 'Continue')));
}
window.SurveyScreen = SurveyScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/survey-website/SurveyScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.FaqList = __ds_scope.FaqList;

__ds_ns.GoalCard = __ds_scope.GoalCard;

__ds_ns.InfoCard = __ds_scope.InfoCard;

__ds_ns.StatRow = __ds_scope.StatRow;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.LikertScale = __ds_scope.LikertScale;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Footer = __ds_scope.Footer;

__ds_ns.LanguageToggle = __ds_scope.LanguageToggle;

__ds_ns.NavBar = __ds_scope.NavBar;

})();
