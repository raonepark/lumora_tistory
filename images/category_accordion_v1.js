// Accordion Category Logic for Lumora Skin
(function () {
  // 1. Dynamic Category Mapping
  // Moves "source" category to be a child of "target" category
  function applyCategoryMapping() {
    var mapRules = [
      {
        target: "개발 & 컴퓨터 활용",
        sources: ["내가 만든 툴", "Appium", "Selenium", "Python"]
      },
      {
        target: "QA & 자동화",
        sources: ["ISTQB 시험 공부"]
      }
    ];

    var links = document.querySelectorAll(".tt_category li > a");
    var linkMap = {};

    // First pass: Index all category links by trimmed text
    for (var i = 0; i < links.length; i++) {
      var text = links[i].firstChild.textContent.trim();
      linkMap[text] = links[i].parentNode; // Store the LI element
    }

    // Apply rules
    mapRules.forEach(function (rule) {
      var parentLi = linkMap[rule.target];
      if (!parentLi) return; // Parent not found, skip

      // Check or create sub-list UL
      var subList = parentLi.querySelector("ul.sub_category_list, ul.sub-category-list");
      if (!subList) {
        subList = document.createElement("ul");
        subList.className = "sub_category_list";
        parentLi.appendChild(subList);
      }

      rule.sources.forEach(function (sourceName) {
        var childLi = linkMap[sourceName];
        if (childLi && childLi.parentNode !== subList) {
          // Determine if childLi is currently in the main DOM tree. 
          // Move it.
          subList.appendChild(childLi);

          // If the source LI had a child UL (nested tistory cat), it moves with it naturally.
        }
      });
    });
  }

  // 2. Setup Accordion Structure (Original Logic Updated)
  function setupAccordion() {
    var categoryItems = document.querySelectorAll(".tt_category li");

    categoryItems.forEach(function (li) {
      // Check for sub-list (either originally there or moved by mapping)
      var subList = li.querySelector("ul.sub_category_list, ul.sub-category-list, ul");
      // Note: Tistory might use plain 'ul' for nested categories if not customized. 
      // Our mapped ones use 'sub_category_list'.

      // Filter out if it's not a direct child UL of this LI (though querySelector finds first descendant)
      // Usually harmless if structure is simple.

      if (subList) {
        li.classList.add("has-sub");

        // 2.1 "View All" Link Injection
        // Check if "View All" already exists
        if (!subList.querySelector(".view-all-item")) {
          var parentLink = li.querySelector("a");
          if (parentLink) {
            var viewAllLi = document.createElement("li");
            viewAllLi.className = "view-all-item";

            var viewAllLink = document.createElement("a");
            viewAllLink.href = parentLink.href;
            viewAllLink.textContent = "📂 전체 보기";
            viewAllLink.className = "link_sub_item view-all-link";

            viewAllLi.appendChild(viewAllLink);
            // Insert as first child
            subList.insertBefore(viewAllLi, subList.firstChild);
          }
        }

        // 2.2 Click Interaction
        var parentLink = li.querySelector("a");

        // Remove existing listener to avoid dupe? 
        // We assume clean slate or efficient event handling.
        // Cloning node to strip listeners is nuclear but safe for multiple runs.
        var newParentLink = parentLink.cloneNode(true);
        parentLink.parentNode.replaceChild(newParentLink, parentLink);
        parentLink = newParentLink;

        parentLink.addEventListener("click", function (e) {
          e.preventDefault();

          // Toggle expanded class
          var isExpanded = li.classList.contains("expanded");
          if (isExpanded) {
            li.classList.remove("expanded");
          } else {
            li.classList.add("expanded");
          }
        });
      }
    });
  }

  // Initialize
  document.addEventListener("DOMContentLoaded", function () {
    applyCategoryMapping();
    setupAccordion();
  });

})();
