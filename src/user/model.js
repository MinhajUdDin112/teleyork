const mongoose = require("mongoose");
const { DateTime } = require("luxon");
const { isValidPassword } = require("mongoose-custom-validators");
const { PROSPECTED } = require("../utils/userStatus");
const { string } = require("joi");
const Schema = mongoose.Schema;
const schema = new Schema(
  {
    serviceProvider: {
      type: Schema.Types.ObjectId,
      ref: "ServiceProvider",
    },
    invoice: [
      {
        type: Schema.Types.ObjectId,
        ref: "Invoice",
      },
    ],
    adHocInvoice: [
      {
        type: Schema.Types.ObjectId,
        ref: "Invoice",
      },
    ],
    alternateContact: {
      type: String,
    },
    csr: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    paymentId: {
      type: String,
    },
    paymentChannel: {
      type: String,
    },
    enrollmentId: {
      type: String,
    },
    sac: {
      type: Number,
    },
    firstName: {
      type: String,
    },
    middleName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    suffix: {
      type: String,
    },
    //social security number
    SSN: {
      type: String,
    },
    maidenMotherName: {
      type: String,
    },
    email: {
      type: String,
      trim: true,
      // validate: {
      //   validator: function (v) {
      //     return /^[\w\d]+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);;
      //   },
      //   message: "Please enter a valid email",
      // },
    },
    otpExpire: { type: Date },
    otpEmail: {
      type: String,
    },
    otpContact: {
      type: String,
    },
    otpVerified: { type: Boolean, default: false },
    password: {
      type: String,
      validate: {
        validator: isValidPassword,
        message:
          "Password must have at least: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
      },
    },
    pwgPassword: {
      type: String,
    },
    contact: {
      type: String,
    },
    city: {
      type: String,
    },
    address1: {
      type: String,
    },
    address2: {
      type: String,
    },
    zip: {
      type: String,
    },
    state: {
      type: String,
    },
    postal: {
      type: String,
    },
    isSameServiceAddress: {
      type: Boolean,
      default: false,
    },
    isNotSameServiceAddress: {
      type: Boolean,
      default: false,
    },
    isPoBoxAddress: {
      type: Boolean,
      default: false,
    },
    mailingAddress1: {
      type: String,
    },
    mailingAddress2: {
      type: String,
    },
    mailingZip: {
      type: String,
    },
    mailingCity: {
      type: String,
    },
    mailingState: {
      type: String,
    },
    PoBoxAddress: {
      type: String,
    },
    poBoxZip: {
      type: String,
    },
    poBoxCity: {
      type: String,
    },
    poBoxState: {
      type: String,
    },
    isTemporaryAddress: {
      type: Boolean,
    },
    drivingLicense: {
      type: String,
    },
    DOB: {
      type: Date,
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
    },
    //best way to reach customer
    bestWayToReach: {
      type: String,
      enum: ["email", "phone", "text", "call", "any"],
    },
    //who received government assistant (Supplemental Nutrition Assistance Program)
    isSelfReceive: {
      type: Boolean,
    },
    isReadyToGetServices: {
      type: Boolean,
    },
    //connectivity plan type
    plan: {
      type: mongoose.Types.ObjectId,
      ref: "Plan",
      ///enum: ["lite", "extreme", "plus"],
    },
    currentPlan: {
      planId: {
        type: String,
      },
      planCharges: {
        type: String,
      },
      productName: {
        type: String,
      },
      additionalCharges: [
        {
          name: {
            type: String,
          },
          amount: {
            type: String,
          },
        },
      ],
      invoiceDueDate: {
        type: String,
      },
      discount: [
        {
          name: {
            type: String,
          },
          amount: {
            type: String,
          },
        },
      ],
      planName: {
        type: String,
      },
      billingPeriod: {
        from: {
          type: String,
        },
        to: {
          type: String,
        },
      },
      chargingType: {
        type: String,
      },
      printSetting: {
        type: String,
      },
    },
    amountPaid: {
      type: String,
    },
    invoiceOneTimeCharges: {
      type: String,
    },
    isACP: {
      type: Boolean,
    },
    lateFee: {
      type: String,
    },
    livesWithAnotherAdult: {
      type: Boolean,
    },
    hasAffordableConnectivity: {
      type: Boolean,
    },
    isSharesIncomeAndExpense: {
      type: Boolean,
    },
    acpProgram: {
      type: Schema.Types.ObjectId,
      ref: "ACPPrograms",
    },
    isEnrollmentComplete: {
      type: Boolean,
      default: false,
    },
    isAgreeToTerms: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    eligibility: {
      type: Boolean,
      default: false,
    },
    carrier: {
      type: Schema.Types.ObjectId,
      ref: "Carrier",
    },
    isProofed: {
      type: Boolean,
      default: false,
    },
    step: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      default: PROSPECTED,
    },
    isSelfEnrollment: {
      type: Boolean,
      default: false,
    },
    isTerribleTerritory: {
      type: Boolean,
      default: false,
    },
    isBillAddress: {
      type: Boolean,
      default: false,
    },
    billID: {
      type: Schema.Types.ObjectId,
      ref: "Billing",
    },
    isDifferentPerson: {
      type: Boolean,
      default: false,
    },
    BenifitFirstName: {
      type: String,
    },
    BenifitMiddleName: {
      type: String,
    },
    BenifitLastName: {
      type: String,
    },
    //social security number
    BenifitSSN: {
      type: String,
    },
    BenifitDOB: {
      type: Date,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
    },
    reajectedReason: {
      type: String,
    },
    approval: [
      {
        approvedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        approved: {
          type: Boolean,
        },
        reason: {
          type: String,
        },
        level: {
          type: Number,
        },
        isEnrolled: {
          type: Boolean,
        },
        isComplete: {
          type: Boolean,
        },
        approvedAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    assignTo: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    ESim: {
      type: Boolean,
      default: false,
    },
    level: {
      type: Array,
    },

    // below field required for nkad & nv
    applicationId: {
      type: String,
    },
    transactionType: {
      type: String,
    },
    resetToken: {
      type: String,
    },
    transactionEffectiveDate: {
      type: Date,
    },
    disconnectReason: {
      type: String,
    },
    token: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    accessToken: {
      type: String,
    },
    serviceType: {
      // type of service i.e DSL,Fiber,Cable,FixedWireless,Satellite,MobileBrodband
      type: String,
    },
    serviceInitializationDate: {
      type: Date,
    },
    serviceInitializationDate: {
      type: Date,
    },
    // consumerFee: {
    //   type: String,
    //   enum: ["0", "1"],
    // },
    // schoolLunchException: {
    //   type: String,
    //   enum: ["0", "1"],
    // },
    // schoolLunchCert: {
    //   type: String,
    //   enum: ["0", "1"],
    // },
    schoolName: {
      type: String,
    },
    phoneNumber: {
      // this is MDN basically
      type: Number,
    },
    subscriberId: {
      type: String,
    },
    etcGeneral: {
      type: String,
    },
    phoneNumberInEbbp: {
      type: Number,
    },
    mdnActivateAt: {
      type: String,
    },
    IMEI: {
      type: String,
    },
    esn: {
      type: String,
    },
    esnId: {
      type: Schema.Types.ObjectId,
      ref: "Sim",
    },
    deviceEligibilty: {
      type: Boolean,
      default: false,
    },
    portedMDN: {
      type: Boolean,
      default: false,
    },
    // remarks keys below
    comRemarks: {
      type: String,
      enum: ["0", "20"],
    },
    confidenceRemarks: {
      type: String,
      enum: ["0", "20"],
    },
    verificationRemarks: {
      type: String,
      enum: ["0", "10"],
    },
    informationRemarks: {
      type: String,
      enum: ["0", "20"],
    },
    disclaimerRemarks: {
      type: String,
      enum: ["0", "10"],
    },
    DOBRemarks: {
      type: String,
      enum: ["0", "20"],
    },
    callDropRemarks: {
      type: Boolean,
    },
    csrRemarks: {
      type: Boolean,
    },
    callQualityRemarks: {
      type: String,
      enum: ["Standard", "Below", "Fatal"],
    },
    remarksComment: {
      type: String,
    },
    QualityRemarks: {
      type: String,
      enum: ["average", "good", "decline", "satisfactory"],
    },
    remarksNote: {
      type: String,
    },
    acpQualify: {
      type: Date,
    },
    assignToQa: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignToPro: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    customerId: {
      type: String,
    },
    serviceStatus: {
      type: String,
    },
    planEffectiveDate: {
      type: String,
    },
    socs: {
      type: Array,
    },
    planExpirationDate: {
      type: String,
    },
    talkBalance: {
      type: String,
    },
    textBalance: {
      type: String,
    },
    dataBalance: {
      type: String,
    },
    simStatus: {
      type: String,
    },
    PUK1: {
      type: String,
    },
    PUK2: {
      type: String,
    },
    ICCIDSTATUS: {
      type: String,
    },
    nladEnrollmentDate: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    activatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    activatedAt: {
      type: Date,
    },
    isNVsuccess: {
      type: Boolean,
      default: false,
    },
    accountType: {
      type: String,
      enum: ["Prepaid", "Postpaid", "ACP"],
    },
    nvBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    EnrolledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignedToUser: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    nladhistory: [
      {
        date: { type: Date, default: Date.now },
        status: String,
      },
    ],
    salesChannel: {
      type: String,
      enum: [
        "Web Consent",
        "New Facebook",
        "Old Facebook",
        "Auto",
        "Email",
        "SMM",
      ],
    },

    source: {
      type: String,
    },
    planHistory: [
      {
        orignalPlan: {
          type: mongoose.Types.ObjectId,
          ref: "Plan",
          ///enum: ["lite", "extreme", "plus"],
        },
        changePlan: {
          type: mongoose.Types.ObjectId,
          ref: "Plan",
          ///enum: ["lite", "extreme", "plus"],
        },
        updatedBy: {
          type: mongoose.Types.ObjectId,
          ref: "User",
        },
        updatedAt: {
          type: Date,
          default: Date.now, // Change this line to use a function
        },
      },
    ],
    statusElectronically: {
      type: String,
    },
    MdnHistory: [
      {
        oldMdn: String,
        newMdn: String,
        updatedBy: { type: mongoose.Types.ObjectId, ref: "User" },
        updatedAt: {
          type: Date,
          default: Date.now, // Change this line to use a function
        },
      },
    ],
    addressHistory: [
      {
        serviceAddress: String,
        MailingAddress: String,
        updatedBy: { type: mongoose.Types.ObjectId, ref: "User" },
        updatedAt: {
          type: Date,
          default: Date.now, // Change this line to use a function
        },
      },
    ],
    pdfPath: {
      type: String,
      default: null,
    },
    imageUrl: {
      type: String,
    },
    selectProduct: {
      type: String,
    },
    totalAmount: {
      type: String,
    },
    invoiceType: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
    billId: {
      type: Schema.Types.ObjectId,
      ref: "Billing",
    },
    label: {
      type: String,
    },
    labelCreatedAt: {
      type: Date,
    },
    invoiceTransId: {
      type: String,
    },
    invoiceStatus: {
      type: String,
    },
    subsequentBill: {
      type: String,
    },
    billingConfigurationHistory: {
      type: Array,
    },
    activeBillingConfiguration: {
      type: Object,
    },
    wallet: {
      type: String,
    },
    files: [
      {
        filetype: String,
        filepath: String,
        audioLink: String,
        uploadedBy: {
          type: mongoose.Types.ObjectId,
          ref: "User",
        },
        uploadDate: {
          type: Date,
          default: () => new Date(),
        },
      },
    ],
    accountId: {
      type: String,
    },
    izZipVerified: {
      type: Boolean,
    },
    internallyactivationDate: {
      type: Date,
    },
    AcptoPrepaid: {
      type: Boolean,
    },
    isUploaded: {
      type: Boolean,
      default: false,
    },
    convertToPrepaidDate: {
      type: String,
    },
    importedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    importedAt: {
      type: Date,
    },
    autopayId: {
      type: String,
    },
    isAutopay: {
      type: Boolean,
    },
    autopayChargeDate: {
      type: String,
    },
    paymentMethodId: {
      type: String,
    },
    stripeCustomerId: {
      type: String,
    },
    isWithoutInvoice: {
      type: Boolean,
    },
    isWithInvoice: {
      type: Boolean,
    },
    acpUploadedFileName: {
      type: String,
    },
    acpUploadedFilePath: {
      type: String,
    },
    orderCreateDate: {
      type: Date,
    },

    newmdn: {
      type: String,
    },
    oldMdn: {
      type: String,
    },
    newMdnAssignAt: {
      type: Date,
    },
  },
  { timestamps: true }
);
schema.set("toJSON", {
  transform: function (doc, ret) {
    if (ret.createdAt) {
      ret.createdAt = DateTime.fromJSDate(ret.createdAt)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }
    if (ret.updatedAt) {
      ret.updatedAt = DateTime.fromJSDate(ret.updatedAt)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }
    if (ret.approvedAt) {
      ret.approvedAt = DateTime.fromJSDate(ret.approvedAt)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }
    if (ret.rejectedAt) {
      ret.rejectedAt = DateTime.fromJSDate(ret.rejectedAt)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }
    if (ret.activatedAt) {
      ret.activatedAt = DateTime.fromJSDate(ret.activatedAt)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }
    if (ret.nladEnrollmentDate) {
      ret.nladEnrollmentDate = DateTime.fromJSDate(ret.nladEnrollmentDate)
        .setZone("America/New_York")
        .toFormat("dd LLL yyyy, h:mm a");
    }
    if (ret.files && ret.files.length > 0) {
      ret.files.forEach((file) => {
        if (file.uploadDate) {
          file.uploadDate = DateTime.fromJSDate(file.uploadDate)
            .setZone("America/New_York")
            .toFormat("dd LLL yyyy, h:mm a");
        }
      });
    }

    return ret;
  },
});

const model = new mongoose.model("Customer", schema);
module.exports = model;
