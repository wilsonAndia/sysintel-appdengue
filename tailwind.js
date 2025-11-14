import { create } from 'twrnc';

const tw = create({
  theme: {
    extend: {
      colors: {
        'blue-sysintel-50': '#f2f8fd',
        'blue-sysintel-100': '#e3effb',
        'blue-sysintel-200': '#c1dff6',
        'blue-sysintel-300': '#8ac5ef',
        'blue-sysintel-400': '#4ca7e4',
        'blue-sysintel-500': '#3498db',
        'blue-sysintel-600': '#176fb2',
        'blue-sysintel-700': '#145990',
        'blue-sysintel-800': '#144c78',
        'blue-sysintel-900': '#164064',
        'blue-sysintel-950': '#0f2942',
      },
    },
  },
});

export default tw;
