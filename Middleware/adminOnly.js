export default function adminOnly(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only admin can access this route" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}












































// // =========================
// // SUBSECTIONS
// // =========================

// // create subsection
// export async function CREATE_SUBSECTION(req, res) {
//   try {
//     const { sectionType, title } = req.body;

//     if (!sectionType || !title) {
//       return res.status(400).json({
//         msg: "sectionType and title are required",
//       });
//     }

//     const allowedTypes = ["one_to_one", "batch"];
//     if (!allowedTypes.includes(sectionType)) {
//       return res.status(400).json({
//         msg: "Invalid sectionType. Choose 'one_to_one' or 'batch'",
//       });
//     }

//     const existing = await SubSection.findOne({
//       sectionType,
//       title: title.trim(),
//     });

//     if (existing) {
//       return res.status(409).json({
//         msg: "Subsection already exists in this section type",
//       });
//     }

//     const subsection = await SubSection.create({
//       sectionType,
//       title: title.trim(),
//       createdBy: req.user._id,
//     });

//     return res.status(201).json({
//       msg: "Subsection created successfully",
//       subsection,
//     });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// }







// // get all subsections with items
// export async function GET_SUBSECTIONS_WITH_ITEMS(req, res) {
//   try {
//     const { sectionType } = req.query;

//     const filter = {};
//     if (sectionType) {
//       filter.sectionType = sectionType;
//     }

//     const subsections = await SubSection.find(filter)
//       .populate("createdBy", "name email role")
//       .sort({ createdAt: -1 });

//     const result = [];

//     for (const subsection of subsections) {
//       const items = await SubSectionItem.find({
//         subSectionId: subsection._id,
//       }).sort({ createdAt: -1 });

//       result.push({
//         subsection,
//         items,
//       });
//     }

//     return res.status(200).json({
//       msg: "Subsections fetched successfully",
//       count: result.length,
//       data: result,
//     });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// }






// // get single subsection with items
// export async function GET_SINGLE_SUBSECTION(req, res) {
//   try {
//     const { id } = req.params;

//     const subsection = await SubSection.findById(id).populate(
//       "createdBy",
//       "name email role"
//     );

//     if (!subsection) {
//       return res.status(404).json({ msg: "Subsection not found" });
//     }

//     const items = await SubSectionItem.find({ subSectionId: id }).sort({
//       createdAt: -1,
//     });

//     return res.status(200).json({
//       msg: "Subsection fetched successfully",
//       subsection,
//       items,
//     });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// }








// // update subsection
// export async function UPDATE_SUBSECTION(req, res) {
//   try {
//     const { id } = req.params;
//     const { sectionType, title } = req.body;

//     const subsection = await SubSection.findById(id);

//     if (!subsection) {
//       return res.status(404).json({ msg: "Subsection not found" });
//     }

//     if (sectionType) {
//       const allowedTypes = ["one_to_one", "batch"];
//       if (!allowedTypes.includes(sectionType)) {
//         return res.status(400).json({
//           msg: "Invalid sectionType. Choose 'one_to_one' or 'batch'",
//         });
//       }
//       subsection.sectionType = sectionType;
//     }

//     if (title) {
//       subsection.title = title.trim();
//     }

//     await subsection.save();

//     return res.status(200).json({
//       msg: "Subsection updated successfully",
//       subsection,
//     });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// }













// // delete subsection and all related boxes
// export async function DELETE_SUBSECTION(req, res) {
//   try {
//     const { id } = req.params;

//     const subsection = await SubSection.findById(id);

//     if (!subsection) {
//       return res.status(404).json({ msg: "Subsection not found" });
//     }

//     await SubSectionItem.deleteMany({ subSectionId: id });
//     await SubSection.findByIdAndDelete(id);

//     return res.status(200).json({
//       msg: "Subsection and all related boxes deleted successfully",
//     });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// }







// // =========================
// // SMART CREATE BOX
// // =========================

// // create box in existing subsection OR create/find subsection and then create box
// export async function CREATE_BOX_WITH_SUBSECTION_SUPPORT(req, res) {
//   try {
//     const { sectionType, subSectionId, newTitle, className, description } = req.body;

//     if (!sectionType || !className) {
//       return res.status(400).json({
//         msg: "sectionType and className are required",
//       });
//     }

//     const allowedTypes = ["one_to_one", "batch"];
//     if (!allowedTypes.includes(sectionType)) {
//       return res.status(400).json({
//         msg: "Invalid sectionType. Choose 'one_to_one' or 'batch'",
//       });
//     }

//     let subsection = null;

//     if (subSectionId) {
//       subsection = await SubSection.findById(subSectionId);

//       if (!subsection) {
//         return res.status(404).json({ msg: "Selected subsection not found" });
//       }

//       if (subsection.sectionType !== sectionType) {
//         return res.status(400).json({
//           msg: "Selected subsection does not belong to the chosen section type",
//         });
//       }
//     }

//     if (!subsection) {
//       if (!newTitle || !newTitle.trim()) {
//         return res.status(400).json({
//           msg: "Please select an existing subsection or enter a new subsection title",
//         });
//       }

//       subsection = await SubSection.findOne({
//         sectionType,
//         title: newTitle.trim(),
//       });

//       if (!subsection) {
//         subsection = await SubSection.create({
//           sectionType,
//           title: newTitle.trim(),
//           createdBy: req.user._id,
//         });
//       }
//     }

//     const image = req.file
//       ? `/uploads/subsection-items/${req.file.filename}`
//       : "";

//     const item = await SubSectionItem.create({
//       subSectionId: subsection._id,
//       image,
//       className: className.trim(),
//       description: description || "",
//       createdBy: req.user._id,
//     });

//     return res.status(201).json({
//       msg: "Box created successfully",
//       subsection,
//       item,
//     });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// }








// // update box
// export async function UPDATE_SUBSECTION_ITEM(req, res) {
//   try {
//     const { id } = req.params;
//     const { className, description } = req.body;

//     const item = await SubSectionItem.findById(id);

//     if (!item) {
//       return res.status(404).json({ msg: "Box not found" });
//     }

//     if (className) item.className = className.trim();
//     if (description !== undefined) item.description = description;

//     if (req.file) {
//       item.image = `/uploads/subsection-items/${req.file.filename}`;
//     }

//     await item.save();

//     return res.status(200).json({
//       msg: "Box updated successfully",
//       item,
//     });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// }

// // delete box
// export async function DELETE_SUBSECTION_ITEM(req, res) {
//   try {
//     const { id } = req.params;

//     const item = await SubSectionItem.findById(id);

//     if (!item) {
//       return res.status(404).json({ msg: "Box not found" });
//     }

//     await SubSectionItem.findByIdAndDelete(id);

//     return res.status(200).json({
//       msg: "Box deleted successfully",
//     });
//   } catch (err) {
//     return res.status(500).json({ error: err.message });
//   }
// }


















































// // subsection routes
// router.route("/subsections").get(rh.GET_SUBSECTIONS_WITH_ITEMS);//get subsections
// router.route("/subsections/create").post(Auth, adminOnly, rh.CREATE_SUBSECTION);//create subsections
// router.route("/subsections/:id").get(rh.GET_SINGLE_SUBSECTION);//get single subsections
// router.route("/subsections/:id").put(Auth, adminOnly, rh.UPDATE_SUBSECTION)//update subsections
//   router.route("/subsections/:id").delete(Auth, adminOnly, rh.DELETE_SUBSECTION);//delete subsections

// // create class box
// router.route("/subsection-items/create-with-subsection").post( Auth,adminOnly,subSectionItemUpload.single("image"), rh.CREATE_BOX_WITH_SUBSECTION_SUPPORT);//create classbox

// // update class box
// router.route("/subsection-items/:id").put(Auth,adminOnly,subSectionItemUpload.single("image"),rh.UPDATE_SUBSECTION_ITEM)
// router.route("/subsection-items/:id").delete(Auth, adminOnly, rh.DELETE_SUBSECTION_ITEM); //delete classbox



// //studends vies section and subsections

// router.route("/student/subsections").get(Auth,studentOnly, rh.GET_SUBSECTIONS_WITH_ITEMS);
// router.route("/student/subsections/:id").get(Auth,studentOnly, rh.GET_SINGLE_SUBSECTION);