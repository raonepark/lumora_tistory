// Accordion Category Logic for Lumora Skin
(function () {
  // 1. Dynamic Category Mapping
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
      // Safe check for text content
      if (links[i].firstChild) {
        var text = links[i].firstChild.textContent.trim();
        // Store the LI element
        linkMap[text] = links[i].parentNode;
      }
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
        }
      });
    });
  }

  // 2. Setup Accordion Structure (Original Logic Updated)
  function setupAccordion() {
    // Select both sidebar and mobile overlay categories
    var categoryItems = document.querySelectorAll("#sidebar .tt_category li, .m-cat-body .tt_category li, li.accordion-parent");

    // Helper to extract count
    var getCount = function (el) {
      var match = el.textContent.match(/\((\d+)\)/);
      return match ? match[1] : '0';
    };

    categoryItems.forEach(function (li) {
      var link = li.querySelector("a");
      if (!link) return;

      // --- 2.1 Universal Count Polish ---
      if (!link.querySelector('.cat-count')) {
        var textContent = link.textContent;
        // Extract count
        var count = getCount(link);
        // Clean name (remove count from end)
        var name = textContent.replace(/\s*\(\d+\)\s*$/, '').trim();

        if (name && textContent.indexOf('분류 전체보기') === -1) {
          link.innerHTML = name + ' <span class="cat-count">(' + count + ')</span>';
        }
      }

      // Check for sub-list (either originally there or moved by mapping)
      // Tistory standard: .sub_category_list or just ul
      var subList = li.querySelector("ul.sub_category_list, ul.sub-category-list, ul");

      if (subList) {
        li.classList.add("has-sub");
        subList.classList.add("sub-category-item"); // Ensure class for CSS
        link.classList.add('accordion-parent'); // Arrow styling

        // --- 2.2 "View All" Link Injection ---
        if (!subList.querySelector(".view-all-item")) {
          var count = getCount(link);

          var viewAllLi = document.createElement("li");
          viewAllLi.className = "view-all-item";

          var viewAllLink = document.createElement("a");
          viewAllLink.href = link.href;
          viewAllLink.innerHTML = '전체 글 <span class="cat-count">(' + count + ')</span>';
          viewAllLink.className = "link_sub_item view-all-link";

          viewAllLi.appendChild(viewAllLink);
          // Insert as first child
          subList.insertBefore(viewAllLi, subList.firstChild);
        }

        // --- 2.3 Click Interaction ---
        // Clone to assume clean state
        var newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);
        link = newLink;

        link.addEventListener("click", function (e) {
          e.preventDefault(); // Stop navigation
          e.stopPropagation(); // Stop bubbling

          // Toggle active class (CSS: .sub-category-item.active { display: block; })
          if (subList.classList.contains("active")) {
            subList.classList.remove("active");
            link.classList.remove("active-parent");
          } else {
            subList.classList.add("active");
            link.classList.add("active-parent");
          }
        });
      }
    });
  }

  // Initialize
  document.addEventListener("DOMContentLoaded", function () {
    // Run mapping first
    applyCategoryMapping();
    // Then setup accordion UI
    setupAccordion();
  });

})();
