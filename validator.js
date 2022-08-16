// Đối tượng Validator
function Validator(options) {

    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {};

    function validate(inputElement, rule) {
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        var errorMessage;

        // Lấy ra các rules của selector
        var rules = selectorRules[rule.selector];
        
        // Lặp qua từng rule & kiểm tra
        // Nếu có lỗi thì dừng việc kiểm
        for (var i = 0; i < rules.length; ++i) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if (errorMessage) break;
        }
        
        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid');
        } else {
            errorElement.innerText = '';
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
        }

        return !errorMessage;
    }

    // Lấy element của form cần validate
    var formElement = document.querySelector(options.form);

    if (formElement) {
        // Khi submit form
        formElement.onsubmit = function (e) {
            e.preventDefault();
            var isFormValid = true;
            // Lặp qua từng rule và validate
            options.rules.forEach(function (rule) {
                var inputElements = formElement.querySelector(rule.selector);
                var isValid = validate(inputElements, rule);
                if (!isValid) {
                    isFormValid = false;
                }
            });

            // Xử lý khi form không có lỗi
            if (isFormValid) {
                // Trường hợp submit vs Javascript
                if (typeof options.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]');

                    // convert nodelist sang array
                    var formValues = Array.from(enableInputs).reduce(function (values, input) {
                        // Gán value vào cho values và return values
                        switch (input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    if (!Array.isArray(values[input.name])){
                                        values[input.name] = ' '
                                    } 
                                    return values;
                                }
                                if (!Array.isArray(values[input.name])){
                                    values[input.name] = [ ]
                                }
                                values[input.name].push(input.value);
                                break;
                                case 'file':
                                    values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value
                        }
                        return values
                    }, {});

                    options.onSubmit(formValues)
                }
                // Trường hợp submit vs hành vi mặc định
                else {
                    formElement.submit();
                }
            }
        }
        // Lặp qua mỗi rule và xử lý (lăng nghe sự kiện blur, input,...)
        options.rules.forEach(function (rule) {
            // Lưu lại các rule cho mỗi input
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test)
            } else {
                selectorRules[rule.selector] = [rule.test];
            }
            var inputElements = formElement.querySelectorAll(rule.selector);

            Array.from(inputElements).forEach(function (inputElement) {
                // Xử lý trường hợp blur khỏi input element
                inputElement.onblur = function () {
                    validate(inputElement, rule)
                }

                // Xử lý trường hợp người dùng đang nhập vào input
                inputElement.oninput = function () {
                    var errorElement = getParent(inputElement, options.formGroupSelector).querySelector('.form-message');
                    errorElement.innerText = '';
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
                }
            })

        })
    }
}


// Định nghĩa rule
// Khi có lỗi thì trả ra lỗi
// Khi hợp lệ => không trả ra gì cả (undifined)
Validator.isRequired = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            return value ? undefined : message || 'Vui lòng nhập trường này'
        }
    }
}

Validator.isEmail = function (selector, message) {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message || 'Trường này phải là email'
        }
    }
}

Validator.minLength = function (selector, min, message) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined : message || `Vui lòng nhập tối thiểu ${min} ký tự`
        }
    }
}

Validator.isconfirmed = function (selector, getConfirmValue, message) {
    return {
        selector: selector,
        test: function (value) {
            return value === getConfirmValue() ? undefined : message || 'Mật khẩu nhập lại không đúng'
        }
    }
}