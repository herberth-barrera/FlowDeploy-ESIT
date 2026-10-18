module.exports = {
  student: {
    nameMin: 2,
    nameMax: 100,
    emailMax: 254,
    majorMin: 2,
    majorMax: 80,
  },
  course: {
    codeMin: 2,
    codeMax: 12,
    nameMin: 2,
    nameMax: 100,
    creditsMin: 1,
    creditsMax: 10,
  },
  academicPeriod: {
    yearMin: 2020,
    yearMax: 2100,
    terms: [1, 2],
  },
};
