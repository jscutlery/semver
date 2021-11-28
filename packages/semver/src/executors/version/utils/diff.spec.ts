import { diff } from './diff';

const FILE_BEFORE = `# This is the header
## This is the second line of the header

change 6

change 5
change 4
change 3
change 2
change 1
`;

const FILE_AFTER = `# This is the header
## This is the second line of the header

change 9

change 8
change 7
change 6

change 5
change 4
change 3
change 2
change 1
`;

describe('diff', () => {
  it('should not include the header in the diff', () => {
    const difference = diff(FILE_BEFORE, FILE_AFTER);

    expect(difference).not.toInclude('# This is the header');
    expect(difference).not.toInclude(
      '## This is the second line of the header'
    );
  });

  it('should not include changes from before', () => {
    const difference = diff(FILE_BEFORE, FILE_AFTER);
    expect(difference).not.toMatch(/change [1-6]/);
  });

  it('should include changes from after', () => {
    const difference = diff(FILE_BEFORE, FILE_AFTER);
    expect(difference).toInclude("change 7");
    expect(difference).toInclude("change 8");
    expect(difference).toInclude("change 9");
  });
});
