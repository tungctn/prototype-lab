# Nguồn Sự Thật Của Dự Án

## Giả Thuyết Làm Việc

AI đã giúp công việc riêng lẻ của product, design và engineering nhanh hơn, nhưng quá trình bàn giao giữa các vai trò này vẫn chậm và rời rạc. Ý định sản phẩm thường bắt đầu từ insight khách hàng, các cuộc họp, ghi chú thô và request Figma. Sau đó design biến ý định đó thành prototype, rồi engineering lại phải dịch prototype đó ngược về codebase.

Dự án này đề xuất một prototype lab nơi product, design và engineering có thể cộng tác trực tiếp trên codebase thật của sản phẩm. Thay vì xem Figma là artifact bàn giao cuối cùng, codebase trở thành nguồn sự thật chung cho các prototype có hình dạng gần với production.

## Một Câu Mô Tả

Một prototype lab native với codebase, nơi PM, designer và engineer cộng tác thông qua các prototype có AI truy cập được, được backup bởi branch, gần production, và mỗi vai trò có thể định hình, review, điều chỉnh và ship.

## Vấn Đề

Product team đã có công cụ AI tốt hơn cho từng cá nhân, nhưng delivery liên chức năng vẫn phụ thuộc vào các nghi thức handoff cũ:

- PM nắm insight khách hàng và product intent, nhưng thường không thể diễn đạt chúng trực tiếp bên trong hệ thống production.
- Designer rất mạnh trong Figma, nhưng Figma-to-code vẫn chưa hoàn hảo vì các công cụ AI vẫn khó map component, cấu trúc layout, cách dùng design system và convention riêng của repo.
- Engineer làm việc trong codebase, nhưng nhận context cuối qua tài liệu, họp và file design, trong khi các thứ này có thể không phản ánh đúng thực tế implementation.
- Cộng tác diễn ra trên nhiều công cụ rời rạc thay vì một môi trường sống, nơi product, design và engineering đều truy cập cùng một prototype bằng ngôn ngữ của vai trò mình.
- Handoff cuối thường bắt engineer phải diễn giải lại cả product intent lẫn design decision trước khi có thể bắt đầu build.

## Người Dùng Mục Tiêu

- Product manager hiểu vấn đề và user flow mong muốn nhưng không muốn làm trực tiếp với source code.
- Product designer muốn iterate bằng design system thật và production component thật thay vì vẽ lại mọi state trong Figma.
- Engineering lead muốn prototype đến dưới dạng branch có thể review, không phải mockup tách rời.
- Startup team cần rút ngắn đường đi từ ý tưởng đến implementation sẵn sàng để build.

## Cộng Tác Ba Bên

Sản phẩm phải đồng thời truy cập được cho product, design và engineering, mà không ép mọi vai trò vào cùng một interface.

- PM cần một bề mặt intent: mô tả vấn đề, user flow, acceptance criteria, insight khách hàng và hành vi mong muốn.
- Designer cần một bề mặt visual: điều chỉnh layout, copy, interaction state, cách dùng design system và mức độ fidelity của prototype.
- Engineer cần một bề mặt implementation: xem diff, lựa chọn component, giả định về data, rủi ro kỹ thuật và độ sẵn sàng merge.

Đối tượng chung là branch-backed prototype. Mỗi vai trò nên có thể đóng góp thông qua AI mà không làm mất context codebase bên dưới.

## Tầm Nhìn Sản Phẩm

Sản phẩm là một AI workspace cộng tác, kết nối với repository hiện có. Nó cho PM, designer và engineer các cách dễ tiếp cận để làm việc với cùng một prototype native với codebase: product intent, visual iteration và implementation review đều xoay quanh cùng một artifact được backup bởi branch.

Workflow lý tưởng:

1. Kết nối repository của sản phẩm.
2. Phân tích codebase, design system, cấu trúc component, route của app và convention đóng góp.
3. Tạo instruction riêng cho repository về cách prototype an toàn.
4. Cho PM mô tả một ý tưởng, insight khách hàng hoặc flow.
5. Tạo sandbox branch với live preview.
6. Cho PM, designer và engineer iterate từ các bề mặt riêng theo vai trò, trong khi tái sử dụng design system và production component hiện có.
7. Chia sẻ preview link để lấy feedback.
8. Cho designer clone hoặc branch một version để iterate visual.
9. Cho engineer kiểm tra branch, review cách dùng component, comment, sửa và merge khi phù hợp.

## Giá Trị Cốt Lõi

Sản phẩm giảm chi phí dịch giữa product intent, design expression và engineering implementation bằng cách làm cho một prototype có thể truy cập được bởi cả ba vai trò.

Nó nên giúp team nhanh hơn bằng cách:

- Biến ý tưởng product thô thành prototype có hình dạng gần production.
- Cho PM, designer và engineer một bề mặt cộng tác chung trên codebase, với các cách prompt, inspect, comment và review phù hợp từng vai trò.
- Làm prototype có thể review qua branch, preview, diff và pull request.
- Tái sử dụng design system và component thật.
- Giảm khoảng cách giữa "design đã được approve" và "engineer có thể bắt đầu build".
- Giữ implementation context gần với source repository thay vì rải rác trong docs, meeting và artifact chỉ có trong Figma.

## Sản Phẩm Tham Chiếu

- LightSprint.ai
- Alloy app

Đây là các tham chiếu định hướng cho AI-assisted product prototyping, codebase-connected iteration và handoff nhanh hơn từ product sang engineering.

## Kiến Trúc Mức Cao

Hệ thống nên luôn kết nối với main repository trong khi cô lập công việc prototype.

Core concepts:

- Repository connection: Sản phẩm kết nối với codebase chính của team.
- Codebase analysis: Hệ thống đọc cấu trúc, route, component, styling pattern, cách dùng design system và repo instruction.
- Generated working guide: Hệ thống tạo instruction riêng của project cho AI prototyping an toàn.
- Sandbox environment: Hệ thống tạo môi trường làm việc đồng bộ, phản chiếu repository.
- Branch per prototype: Mỗi prototype mới nằm trên branch riêng.
- Preview per branch: Mỗi branch có deployment preview có thể chia sẻ.
- Review path: Engineer có thể inspect diff, kiểm tra cách dùng component và quyết định merge, modify hoặc discard.

## Hackathon MVP

Hackathon nên chứng minh collaboration loop, không cần giải quyết mọi vấn đề code generation.

Demo tối thiểu nhưng đáng yêu:

- Repository dashboard hiển thị context project đã kết nối.
- Project brief hoặc instruction layer được tạo dựa trên phân tích repository.
- Input riêng theo vai trò cho PM intent, design iteration và engineering review.
- Prototype workspace tạo hoặc giả lập thay đổi được backup bởi branch.
- Live preview URL hoặc embedded preview.
- Version list hiển thị prototype branch và status.
- Shared review view tóm tắt thay đổi, file/component nào bị chạm, design decision nào đã được đưa ra và engineer nên review gì.

## Câu Chuyện Demo Gợi Ý

Dùng một kịch bản realistic từ PM đến engineering:

1. PM nhập một ý tưởng feature thô.
2. Hệ thống tham chiếu codebase hiện có và design convention.
3. Hệ thống tạo prototype gần với production.
4. Prototype nhận preview link.
5. Designer clone prototype và điều chỉnh UI.
6. Engineer mở handoff view, thấy file đã thay đổi và implementation note, rồi có thể tiếp tục từ branch.

## Đây Không Phải Là

- Không phải một generic AI website builder.
- Không phải thay thế engineer.
- Không phải Figma clone.
- Không phải low-code platform tách khỏi sản phẩm thật.
- Không phải hệ thống merge-to-production hoàn toàn tự động.

## Mũi Nhọn Chiến Lược

Mũi nhọn mạnh nhất không phải là "AI builds apps". Thị trường đó đã đông và rộng.

Mũi nhọn sắc hơn là:

"Làm cho product prototype có thể truy cập bởi product, design và engineering vì chúng được tạo bên trong codebase thật, dùng design system thật, trên branch thật với preview thật."

Định vị này cho sản phẩm một buyer pain cụ thể: handoff chậm, phải dịch lại nhiều lần và prototype thiếu độ tin cậy.

## Rủi Ro Chính

- Rủi ro chất lượng code: Thay đổi do AI tạo có thể lộn xộn, dễ vỡ hoặc không nhất quán với standard của team.
- Rủi ro niềm tin: Engineer có thể từ chối branch do PM tạo nếu sản phẩm tạo cảm giác làm tăng việc cleanup.
- Rủi ro workflow: Team có thể không muốn PM và designer làm việc gần codebase nếu không có guardrail mạnh.
- Rủi ro khác biệt hóa: "AI prototyping" là thị trường đông. Sản phẩm phải thật rõ là codebase-native và handoff-focused.
- Rủi ro phạm vi: Xây repo analysis, sandboxing, preview, branching, review và collaboration là quá nhiều cho hackathon ngắn nếu không mock hoặc thu hẹp mạnh.
- Rủi ro persona: PM muốn outcome, designer muốn control, engineer muốn code quality. MVP phải chọn persona nào phục vụ trước.

## Nguyên Tắc Sản Phẩm

- Codebase là nguồn sự thật.
- Công việc prototype nên được cô lập và có thể review.
- AI nên đi theo design system và component pattern hiện có của repository.
- PM và designer không cần tự sửa source code để đóng góp.
- Engineer không cần reverse-engineer product intent hoặc design intent từ mockup tĩnh.
- Engineer vẫn nắm quyền kiểm soát chất lượng production và merge.
- Mỗi prototype nên tạo cả visual preview lẫn engineering handoff.

## Câu Hỏi Mở

- Buyer đầu tiên là ai: PM leader, design leader, engineering leader hay founder?
- Use case đầu tiên là internal product team, agency hay startup founder?
- MVP có nên tạo branch thật, hay giả lập branch cho demo?
- Repository/framework nào được hỗ trợ đầu tiên?
- Hệ thống ngăn code sinh ra lộn xộn trở thành engineering debt bằng cách nào?
- Permission model nào giúp PM và designer productive mà không làm engineer lo lắng?
- Đâu là bằng chứng nhỏ nhất cho thấy workflow này nhanh hơn handoff Figma-plus-ticket?

## Quyết Định Hiện Tại

Với hackathon này, sản phẩm nên tập trung làm cho ý tưởng dễ hiểu và đáng tin:

- Thể hiện nỗi đau của handoff rời rạc.
- Thể hiện vòng lặp prototype native với codebase.
- Thể hiện preview được backup bởi branch.
- Thể hiện handoff summary thân thiện với engineer.
- Tránh hứa hẹn merge production hoàn toàn tự động.

## Đối Chiếu Với HTML Flow Hiện Tại

### Tóm Tắt

`project.md` rộng hơn hai file HTML đang có. Nó mô tả sản phẩm đầy đủ cho PM, designer và engineer, với branch-backed prototype, review path và engineering handoff. Hai HTML hiện tại đang là demo slice đơn giản hơn: product nhập prompt/chat, hệ thống lưu session/message, tạo preview trong sandbox và mở preview.

### Điểm Khớp

- Cùng lấy codebase làm nguồn sự thật, không phải Figma hay mockup tách rời.
- Cùng tập trung vào prototype gần production, có preview để xem trong app thật.
- Cùng chấp nhận hackathon demo có thể mock hoặc simulate branch/sandbox thay vì xây production architecture đầy đủ.
- Cùng tránh hứa hẹn merge production tự động.
- `api-database-demo.html` khớp với hướng chat nhiều lượt hơn bản schema ban đầu, vì đã có `chat_sessions`, `chat_messages`, `prototype_items` và SSE.

### Điểm Lệch Cần Chú Ý

- `project.md` nói sản phẩm phải phục vụ cả PM, designer và engineer; `product-workflow-flow.html` hiện mới tập trung product user nhập prompt và xem preview.
- `project.md` coi branch-backed prototype, version list, diff, PR và review path là phần quan trọng của MVP; HTML flow hiện đang ghi "chưa cần Keep, Revise, Discard, Handoff hoặc Promote" và chưa mô tả handoff/review view.
- `project.md` có designer clone/branch một version để visual iteration; HTML hiện tại chưa có surface cho designer.
- `project.md` có engineer inspect branch, review component usage, comment, modify và merge khi phù hợp; HTML hiện tại chưa có engineering surface, diff summary hay changed files.
- `project.md` nhắc generated project brief/instruction layer từ codebase analysis; HTML flow hiện tại chỉ nói repo/sandbox đã setup, chưa có bước tạo brief/instruction layer.
- `api-database-demo.html` hiện ưu tiên chat + SSE và DB session/message; `project.md` không quy định chi tiết chat/SSE, nên đây là implementation detail hợp lý cho demo, không mâu thuẫn.

### Kết Luận Đối Chiếu

Không có mâu thuẫn nghiêm trọng nếu xem HTML hiện tại là demo slice đầu tiên cho persona PM/product. Tuy nhiên, nếu muốn bám sát `project.md` làm source of truth cho hackathon MVP, cần bổ sung thêm ít nhất 3 mảnh vào HTML flow:

1. Một generated project brief/instruction layer sau khi repo được connect/analyze.
2. Một version/prototype branch list thể hiện branch-backed preview và status.
3. Một review/handoff summary cho engineer, gồm changed files, component touched, design decisions và implementation notes.

Gợi ý chính sách scope: giữ flow product chat/SSE hiện tại làm bước tạo prototype, nhưng thêm một phần "review surface" đơn giản để không lệch với source-of-truth về collaboration ba bên.
