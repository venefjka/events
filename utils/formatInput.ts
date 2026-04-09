export const formatDateInput = (input: string) => {
    const digits = (input || '').replace(/\D/g, '').slice(0, 8); // DDMMYYYY
    const dd = digits.slice(0, 2);
    const mm = digits.slice(2, 4);
    const yyyy = digits.slice(4, 8);

    let out = dd;
    if (digits.length > 2) out += '.' + mm;
    if (digits.length > 4) out += '.' + yyyy;

    return out;
};

export const formatTimeInput = (input: string) => {
    const digits = (input || '').replace(/\D/g, '').slice(0, 4); // HHMM
    const hh = digits.slice(0, 2);
    const mm = digits.slice(2, 4);

    let out = hh;
    if (digits.length > 2) out += ':' + mm;

    return out;
};
