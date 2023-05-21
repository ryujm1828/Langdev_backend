//xss공격 방지
const sanitizeHtml = require("sanitize-html");

const sanitizeOption = {
    allowedTags: ['h1', 'h2', 'h3','h4','h5','h6','b', 'i', 'u', 's', 'p', 'ul', 'ol', 'li', 'blockquote', 'a', 'img','br'],
    allowedAttributes: {
        a: ['href', 'name', 'target'],
        img: ['src'],
        li: ['class'],
    },
    allowedSchemes: ['data', 'http'],
};

const sanitizer = (dirty) => {
    return sanitizeHtml(dirty,sanitizeOption);
}

module.exports = sanitizer;