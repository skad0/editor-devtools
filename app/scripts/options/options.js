requirejs(['react', 'lodash', 'options/app'], function (React, _, app) {
    'use strict';
    
    var appElement = React.createElement(app);
    React.render(appElement, document.getElementById('root'));
});

